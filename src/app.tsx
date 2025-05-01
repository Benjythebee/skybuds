import { SceneProvider } from "store/SceneContext";
import Scene from "./scene";
import { Menu } from "menu";
import { gui } from "lib/config";
import React from "react";


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
                <Scene />
                <Menu />
                <div className="absolute z-10 top-8 left-2">
                    <div  ref={ref} id="gui_container" />
                </div>
            </SceneProvider>
        </div>
    );
}