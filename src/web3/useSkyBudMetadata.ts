import SkybudsABI from "./SkyBudsABI.json"
import { useReadContract } from "wagmi"
import { SkyBudMetadata } from "./utils"

export const useSkyBudMetadata = (tokenId:number) => {

    const {data,isLoading,error} = useReadContract({
      address:(import.meta.env.VITE_DEPLOYED_SKYBUDS||'0x') as `0x${string}`,
      abi:SkybudsABI.abi,
      functionName:'tokenURI',
      query:{enabled:!!tokenId},
      args:[tokenId],
    }) 

    const decoded = data? JSON.parse(atob((data as string).split(',')[1])):null
    return {
        data:decoded as SkyBudMetadata | null,
        isLoading,
    }
}