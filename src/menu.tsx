import { Walker } from "lib/Walker"
import { useSceneContext } from "store/SceneContext"


export const Menu = () => {

    const {world} = useSceneContext()


    return (
        <menu className="absolute top-5 right-10 flex flex-col gap-1 items-center justify-center text-white z-10">
            <button onClick={() => {
                Walker.create(world)
            }} className="bg-green-900 p-2 cursor-pointer">
                Create walker
            </button>
            <button onClick={() => {
                Walker.removeWalker(Walker.walkers.length-1)
            }} className="bg-red-900 p-2 cursor-pointer">
                Remove walker
            </button>
        </menu>
    )
}