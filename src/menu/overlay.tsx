import { Walker } from "lib/Walker"
import { X } from "lucide-react"
import React from "react"
import { useSceneContext } from "store/SceneContext"

export const Overlay: React.FC<any> = () => {

    const {world} = useSceneContext()
    const [walker, setWalker] = React.useState<Walker|null>(null)

    React.useEffect(() => {
        const onSelected = (walker: Walker) => {
            setWalker(walker)
        }

        const onUnselected = () => {
            setWalker(null)
        }

        Walker.events.on('walkerSelected', onSelected)
        Walker.events.on('walkerUnselected', onUnselected)
        return () => {
            Walker.events.off('walkerSelected', onSelected)
            Walker.events.off('walkerUnselected', onUnselected)
        }
    },[])

    const deselect = () => {
        Walker.unFocusWalker()
        setWalker(null)
    }

    return (
        <div className="OVERLAYContainer absolute bottom-10 left-1/2 -translate-x-1/2 w-[28%] min-w-[383px] h-[150px] flex items-center justify-center pointer-events-none z-[11]">
            {walker && (
                <div className="relative bg-black/40 backdrop-blur-md p-4 rounded pointer-events-auto flex gap-2 text-white">
                    <div className="group absolute top-0 -right-2 w-8 h-8 cursor-pointer hover:font-bold" onClick={() => {deselect()}}>
                        <X className="w-6 h-6 text-white group-hover:stroke-3 " />
                    </div>
                    <div>
                        {walker.walkerInfo.image_url?
                        <img src={walker.walkerInfo.image_url} alt={walker.walkerInfo.name} className="w-32 h-32 rounded-lg"/>:
                            <div className="w-32 h-32 rounded-lg bg-gray-500 animate-pulse"/>}
                    </div>
                    <div className="flex flex-col justify-center items-start gap-1">
                        <h2 className="text-lg font-bold">{walker.walkerInfo.name}</h2>
                        <p>Creator: {walker.walkerInfo.creator.toString()}</p>
                        <div className="grid grid-cols-2 gap-1">
                            <span className="text-sm text-gray-400">Talkative value</span>
                            <span className="text-sm">{walker.walkerInfo.talkative}</span>
                            <span className="text-sm text-gray-400">Speed</span>
                            <span className="text-sm">{walker.walkerInfo.speed}</span>
                            <span className="text-sm text-gray-400">Laziness</span>
                            <span className="text-sm">{walker.walkerInfo.laziness}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}