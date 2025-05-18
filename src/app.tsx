import { SceneProvider } from "./store/SceneContext";
import Scene from "./scene";
import { RightMenu } from "./menu/RightMenu";
import { gui } from "./lib/config";
import React from "react";
import { Loader } from "./loader";
import { Web3Provider } from "./lib/web3/provider";
import { Overlay } from "./menu/overlay";
import { LoadedSkyBuds } from "./components/loadedSkybuds";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isViewMode } from "./lib/utils/featureFlags";
import { useIsMobile } from "./hooks/useIsMobile";

export const App = () => {
    const ref = React.useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile()
    React.useEffect(() => {
        if(ref.current === null) return;
        const guiContainer = ref.current
        if(isViewMode) return
        if(isMobile) return
        guiContainer.appendChild(gui.domElement);
    },[ref.current]);

    const queryClient = React.useMemo(() => {
        return new QueryClient()
    },[])
    return (
        <div className="w-full h-full relative">
            <SceneProvider>
                <Loader />
                <Scene />
                {!isViewMode && <Web3Provider>
                    <RightMenu />
                    <Overlay />
                </Web3Provider>}
                <QueryClientProvider client={queryClient}>
                    <LoadedSkyBuds />
                </QueryClientProvider>
                <div className="absolute z-10 top-8 left-2">
                    <div  ref={ref} id="gui_container" />
                </div>
            </SceneProvider>
        </div>
    );
}