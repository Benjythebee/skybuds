import { useQuery } from "@tanstack/react-query"
import SkybudsABI from "../web3/SkyBudsABI.json"
import { useChainId, useReadContract } from "wagmi"


const fetchData = async (chain: 'testnet'|'base',tokenId:number) => {
    const response = await fetch(`https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-e3654022-a1de-4e38-8803-0192db058ebe/skybuds/get_owner?chain=${chain}&tokenId=${String(tokenId)}`)
    const json = await response.json();
    return json;
};

const hasEthereum = 'ethereum' in window

export const useSkyBudOwner = (tokenId:number,isMinted:boolean=false) => {

    const chainId = useChainId()
    const address = chainId != 84532 ? import.meta.env.VITE_SKYBUDS_MAINNET : import.meta.env.VITE_DEPLOYED_SKYBUDS_SEPOLIA
    const chainname = chainId != 84532 ?'base':'testnet'
    const {data,isLoading,error} = useReadContract({
      address:(address||'0x') as `0x${string}`,
      abi:SkybudsABI.abi,
      functionName:'ownerOf',
      query:{enabled:!!tokenId && isMinted && hasEthereum},
      args:[tokenId],
    });

    const {data:ownerDataFromAPI,isLoading:isLoadingAPICall} = _useSkybudOwner(chainname,tokenId)

    return {
        data:data as string | null || ownerDataFromAPI.owner,
        isLoading:isLoading || isLoadingAPICall,
    }
}


  const _useSkybudOwner = (chain: 'testnet'|'base',tokenId:number) => {
      return useQuery(
          {
              initialData:{owner:undefined} as {owner:string|undefined},
              queryKey: ['skybuds', chain,tokenId],
              refetchOnMount:true,
              enabled: !!tokenId && !hasEthereum,
              refetchOnWindowFocus: false,
              queryFn: () => tokenId?fetchData(chain,tokenId):null,
              select: (data) => {
                  return (data?data:{owner:undefined}) as {owner:string|undefined}
              },
          });
  }