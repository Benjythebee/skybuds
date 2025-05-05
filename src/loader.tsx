import { useEffect, useState } from "react"
import { useSceneContext } from "store/SceneContext"



export const Loader = () => {
    const {world} = useSceneContext()
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    useEffect(() => {
        if(!world) return
        if(world.baseMesh){
            setIsComplete(true)
            return
        }

        world.loadManager.onProgress = (item, loaded, total) => {
            setProgress(loaded / total)
        }

        world.loadManager.onLoad = () => {
            setIsComplete(true)
        }

    },[world])


    return (
        <div className={`
          absolute bottom-8 left-1/2 transform -translate-x-1/2
          ${isComplete ? 'opacity-0' : 'opacity-100'}
          w-64 p-4 rounded-xl bg-black bg-opacity-50 backdrop-blur shadow-lg 
          transition-opacity duration-700 ease-out z-10
        `}>
          <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-3 text-sm text-white text-opacity-90 font-light">
            <span>Loading</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      );
    };
