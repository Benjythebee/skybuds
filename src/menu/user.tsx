import { ConnectWalletButton } from "components/connectButton"
import { PlusCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { Tabs } from "./RightMenu"

export const UserMenu = ({setPage}:{setPage:(val:Tabs)=>void}) => {

    const {address} = useAccount()

    return (
    <div className="max-h-64 overflow-x-hidden overflow-y-scroll w-120 p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
        {!address?(
            <ConnectWallet />
        ):(
            <Inventory setPage={setPage} />
        )}
    </div>
    )
}

export const Inventory = ({setPage}:{setPage:(val:Tabs)=>void}) => {

    const listOfWalkers:{
        name: string
        description: string
        image: string
        tokenId: string
    }[] = []
    return (
        <div>
            <h2 className="text-lg font-semibold mb-2">Your SkyBuds</h2>
            <p className="text-sm text-white mb-4">
                You have {listOfWalkers.length} SkyBuds in your wallet.
            </p>
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
                <button onClick={()=>setPage(Tabs.ADD)} className="bg-purple-500 text-black hover:text-white hover:bg-purple-900 rounded-lg p-2 cursor-pointer "><PlusCircle className="font-bold w-6 h-6"/></button>
                </h2>
        </div>
    )
}

export const ConnectWallet = () => {
 
    return (
      <div className="">
        <h2 className="text-lg font-semibold mb-2">Connect Wallet</h2>
        <p className="text-sm text-white mb-4">
          Connect your wallet to see your SkyBuds and add new ones.
        </p>
        <ConnectWalletButton />
      </div>
    );
  }
  