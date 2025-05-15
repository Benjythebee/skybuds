import { useQuery } from '@tanstack/react-query';
import { SkyBudMetadata } from '../web3/utils';

const fetchData = async (chain: 'testnet'|'base') => {
    const response = await fetch(`https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-e3654022-a1de-4e38-8803-0192db058ebe/skybuds/get_nfts?chain=${chain}`)
    const json = await response.json();
    console.log('json',json)
    return json;
};

export const useSkybuds = (chain: 'testnet'|'base') => {
    return useQuery(
        {
            initialData: [],
            queryKey: ['skybuds', chain],
            refetchOnMount:true,
            refetchOnWindowFocus: false,
            queryFn: () => fetchData(chain),
            select: (data) => {
                return data as SkyBudMetadata[]
            },
        });
};