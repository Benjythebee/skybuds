import { ConnectWalletButton } from "../components/connectButton"
import { PlusCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { Tabs } from "./RightMenu"
import { Walker } from "../lib/Walker"
import { useSceneContext } from "../store/SceneContext"
import { useViewContext } from "../store/ViewContext"

export const UserMenu = ({setPage,closeMenu}:{setPage:(val:Tabs)=>void,closeMenu?:()=>void}) => {

    const {address} = useAccount()
    const {isGuest} = useViewContext(state => state)
    return (
    <div className="max-h-64 overflow-x-hidden overflow-y-scroll w-120 p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
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
    const onCreateSkybud = () => {
        const w = Walker.create(world,undefined,{
            creator:address||'Guest',
        })
        setPage(Tabs.MENU)
        closeMenu && closeMenu()
        Walker.focusWalker(w)
    }

    const listOfWalkers:{
        name: string
        description: string
        image: string
        tokenId: string
    }[] = []
    return (
        <div>
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
            <div className="grid grid-cols-2 gap-4">
                {listOfWalkers.map((walker, index) => (
                    <div key={walker.tokenId} className="bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">{walker.name}</h3>
                        <p className="text-sm text-gray-400">{walker.description}</p>
                    </div>
                ))}
            </div>
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
  