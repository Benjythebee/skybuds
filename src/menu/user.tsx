import { ConnectWalletButton } from "../components/connectButton"
import { PlusCircle } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { Tabs } from "./RightMenu"
import { Walker } from "../lib/Walker"
import { useSceneContext } from "../store/SceneContext"
import { useViewContext } from "../store/ViewContext"
import { useOwnedSkybuds } from "../hooks/useOwnedSkybuds"
import { cn } from "../lib/ui-helpers/cn"


export const UserMenu = ({setPage,closeMenu}:{setPage:(val:Tabs)=>void,closeMenu?:()=>void}) => {

    const {address} = useAccount()
    const {isGuest} = useViewContext(state => state)
    return (
    <div className={cn(" p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white"
    )}>
        {isGuest || address?(
            <Inventory setPage={setPage} closeMenu={closeMenu} />
        ):(<ConnectWallet />)}
        
    </div>
    )
}

export const Inventory = ({setPage,closeMenu}:{setPage:(val:Tabs)=>void,closeMenu?:()=>void}) => {

    const {world} = useSceneContext()
    const {address} = useAccount()
    const {isGuest, setIsGuest} = useViewContext(state => state)
    const chainId = useChainId()
    const {data,isLoading} = useOwnedSkybuds(chainId!=84532?'base': 'testnet',address as string)

    const onCreateSkybud = () => {
        const w = Walker.create(world,undefined,{
            creator:address||'Guest',
        })
        setPage(Tabs.MENU)
        closeMenu && closeMenu()
        Walker.focusWalker(w)
    }

    const onSelectedOwnedWalker = (tokenId:number) => {
        const walker = Walker.walkers.find(w => w.walkerInfo.tokenId == tokenId)
        if(walker){
            setPage(Tabs.MENU)
            closeMenu && closeMenu()
            Walker.focusWalker(walker)
        }
    }

    const listOfWalkers:{
        name: string
        description: string
        image: string
        tokenId: string
    }[] = data
    return (
        <div className="w-full h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex gap-2">Your SkyBuds <p>{isGuest?'[GUEST MODE]':''}</p></h2>
            <p className="text-sm text-white mb-4">
                You have {listOfWalkers.length} SkyBuds in your wallet.
            </p>
            {
                isGuest && <p className="text-sm text-white mb-4">
                    You are in guest mode. You can create new SkyBuds, but they will not be permanent. 
                    <a
                    href="#"
                    onClick={() =>{
                        setIsGuest(false)
                         setPage(Tabs.WALLET)
                    }}
                    className="underline text-blue-400 cursor-pointer"> Click here to connect your wallet</a>
                </p>
            }
            {!isGuest &&<div className="overflow-y-scroll min-h-32">
                <div className={cn("relative grid grid-cols-3 gap-4 p-2 content-start h-44")}>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        </div>
                    )}
                    {listOfWalkers.map((walker, index) => (
                        <div key={walker.tokenId} className="aspect-auto bg-gray-800 rounded-lg shadow-md cursor-pointer" onClick={()=>{
                            onSelectedOwnedWalker(parseInt(walker.tokenId))
                        }}>
                            <div className="relative">
                                <img
                                    src={walker.image}
                                    alt={walker.name}
                                    className="w-full h-32 object-cover rounded-lg" />
                                <h3 className="absolute w-full text-center py-1 rounded-lg bg-gray-500/10 backdrop-blur-md bottom-0 right-1/2 translate-x-1/2 text-sm font-semibold">{walker.name}</h3>
                            </div> 
                        </div>
                    ))}
                </div>
            </div>}

            <h2 className=" flex justify-between pt-2 border-t-2 border-white">
                <span className="text-lg font-semibold ">Add a new SkyBud</span>
                <button onClick={()=>onCreateSkybud()} className="bg-purple-500 text-black hover:text-white hover:bg-purple-900 rounded-lg p-2 cursor-pointer "><PlusCircle className="font-bold w-6 h-6"/></button>
                </h2>
        </div>
    )
}

export const ConnectWallet = () => {
    const {setIsGuest} = useViewContext(state => state)
    return (
      <div className="">
        <h2 className="text-lg font-semibold mb-2">Connect Wallet</h2>
        <p className="text-sm text-white mb-4">
          Connect your wallet to see your SkyBuds and add new ones.
        </p>
        <div className="flex justify-around gap-2">
        <ConnectWalletButton />
        <button onClick={() => setIsGuest(true)} className="cursor-pointer rounded-xl p-2 border-white border-2  hover:bg-white/10 flex gap-2 items-center font-bold">
          Continue as Guest
        </button>
        </div>
      </div>
    );
  }
  