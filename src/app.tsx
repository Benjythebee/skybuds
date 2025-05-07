import { SceneProvider } from "store/SceneContext";
import Scene from "./scene";
import { RightMenu } from "menu/RightMenu";
import { gui } from "lib/config";
import React from "react";
import { Loader } from "./loader";
import { Web3Provider } from "lib/web3/provider";
import { Overlay } from "./menu/Overlay";


export const App = () => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if(ref.current === null) return;
        const guiContainer = ref.current
        
        guiContainer.appendChild(gui.domElement);
    },[ref.current]);
    return (
        <div className="w-full h-full relative">
            <SceneProvider>
                <Loader />
                <Scene />
                <Web3Provider>
                    <RightMenu />
                </Web3Provider>
                <Overlay />
                <div className="absolute z-10 top-8 left-2">
                    <div  ref={ref} id="gui_container" />
                </div>
            </SceneProvider>
        </div>
    );
}