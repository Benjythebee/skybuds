import SkybudsABI from "../web3/SkyBudsABI.json"
import { useChainId, useReadContract } from "wagmi"
import { SkyBudMetadata } from "../web3/utils"

export const useSkyBudMetadata = (tokenId:number) => {
    const chainId = useChainId()

    const address = chainId != 84532 ? import.meta.env.VITE_SKYBUDS_MAINNET : import.meta.env.VITE_DEPLOYED_SKYBUDS_SEPOLIA

    const {data,isLoading,error,refetch} = useReadContract({
      address:(address||'0x') as `0x${string}`,
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