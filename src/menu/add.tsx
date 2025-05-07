import React from "react"
import { useAccount } from "wagmi"
import { Tabs } from "./RightMenu"

export const AddTab = ({setPage}:{setPage:(val:Tabs)=>void}) => {

    const {address} = useAccount()

    React.useEffect(() => {
        if(!address){
            setPage(Tabs.WALLET)
        }
    },[address])

    return (
    <div className="max-h-120 overflow-x-hidden overflow-y-scroll w-120 p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
        
    </div>
    )
}