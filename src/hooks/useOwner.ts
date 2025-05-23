import { useQuery } from "@tanstack/react-query"
import SkybudsABI from "../web3/SkyBudsABI.json"
import { useReadContract } from "wagmi"


const fetchData = async (chain: 'testnet'|'base',tokenId:number) => {
    const response = await fetch(`https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-e3654022-a1de-4e38-8803-0192db058ebe/skybuds/get_owner?chain=${chain}&tokenId=${String(tokenId)}`)
    const json = await response.json();
    return json;
};

const hasEthereum = 'ethereum' in window

export const useSkyBudOwner = (chain:'testnet'|'base',tokenId:number,isMinted:boolean=false) => {

    const {data,isLoading,error} = useReadContract({
      address:(import.meta.env.VITE_DEPLOYED_SKYBUDS||'0x') as `0x${string}`,
      abi:SkybudsABI.abi,
      functionName:'ownerOf',
      query:{enabled:!!tokenId && isMinted && hasEthereum},
      args:[tokenId],
    });

    const {data:ownerDataFromAPI,isLoading:isLoadingAPICall} = useSkybudOwner(chain,tokenId)

    return {
        data:data as string | null || ownerDataFromAPI.owner,
        isLoading:isLoading || isLoadingAPICall,
    }
}


  const useSkybudOwner = (chain: 'testnet'|'base',tokenId:number) => {
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