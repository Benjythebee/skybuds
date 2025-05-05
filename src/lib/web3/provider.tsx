import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
    base,
  } from 'wagmi/chains';
  import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import { WagmiProvider } from "wagmi";

const config = getDefaultConfig({
    appName: 'SkyBuds',
    projectId: import.meta.env.VITE_PROJECT_ID||'',
    chains: [base],
    ssr: false, // If your dApp uses server side rendering (SSR)
  });

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient();
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme()} modalSize="compact" >
                {children}
            </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}