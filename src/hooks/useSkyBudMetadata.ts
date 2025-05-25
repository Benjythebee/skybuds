import SkybudsABI from "../web3/SkyBudsABI.json"
import { useReadContract } from "wagmi"
import { SkyBudMetadata } from "../web3/utils"

export const useSkyBudMetadata = (tokenId:number) => {

    const {data,isLoading,error,refetch} = useReadContract({
      address:(import.meta.env.VITE_DEPLOYED_SKYBUDS_SEPOLIA||'0x') as `0x${string}`,
      abi:SkybudsABI.abi,
      functionName:'tokenURI',
      query:{enabled:false,refetchOnWindowFocus:false,refetchOnMount:false,refetchOnReconnect:false},
      args:[tokenId],
    }) 

    const decoded = data? JSON.parse(atob((data as string).split(',')[1])):null
    return {
        data:decoded as SkyBudMetadata | null,
        isLoading,
        refetch:refetch
    }
}