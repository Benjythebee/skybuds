import { useQuery } from "@tanstack/react-query"
import { SkyBudMetadata } from "../web3/utils";


const fetchData = async (chain: 'testnet'|'base',wallet:string) => {
    const response = await fetch(`https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-e3654022-a1de-4e38-8803-0192db058ebe/skybuds/get_owned_nfts?chain=${chain}&ownerWallet=${String(wallet)}`)
    const json = await response.json();
    return json;
};

const hasEthereum = 'ethereum' in window

export const useOwnedSkybuds = (chain:'testnet'|'base',wallet:string) => {

    const {data,isLoading,isPending,isFetching} = _useOwnedSkybud(chain,wallet)

    return {
        data,
        isLoading:isPending||isFetching||isLoading,
    }
}


  const _useOwnedSkybud = (chain: 'testnet'|'base',wallet:string) => {
      return useQuery(
          {
              initialData:[],
              queryKey: ['skybuds', chain,wallet],
              refetchOnMount:true,
              enabled: !!wallet && hasEthereum,
              refetchOnWindowFocus: false,
              refetchOnReconnect: false,
              queryFn: () => wallet?fetchData(chain,wallet):[],
              select: (data) => {
                    if(!Array.isArray(data)){
                        return []
                    }

                  return data as SkyBudMetadata[] || []
              },
          });
  }