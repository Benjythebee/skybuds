import { cn } from "../lib/ui-helpers/cn"
import { Walker } from "../lib/Walker"
import { ITEMS_BY_CATEGORY, WearableWithIndex } from "../lib/wearables/items"
import { Wearable } from "../lib/wearables/Wearable"
import React, { useState } from "react"
import { useSceneContext } from "../store/SceneContext"
import { useWearableOverlayStore } from "../store/wearableOverlayStore"

export const WearablesGrid = ()=>{
    const { isOpen } = useWearableOverlayStore()
    const {world} = useSceneContext()
    const [selectedItem, setSelectedItem] = useState<Wearable | null>(null)
    const [selectedCategory, setSelectedCategory] = useState(Object.keys(ITEMS_BY_CATEGORY)[0])

    const handleSelectItem = (item: WearableWithIndex) => {
      const focusedWalker = Walker.focusedWalker
      if(!focusedWalker) return
      if(item.index == undefined) return
      if(!focusedWalker.hatWearables){
        focusedWalker.hatWearables = {} as any
      }
      const prevItem = focusedWalker.hatWearables![item.category]
      if (prevItem?.wearableData.category == item.category) {
        // remove previous item
        Wearable.dispose(prevItem)
      }
      
      focusedWalker.hatWearables![item.category] = new Wearable(world.scene, focusedWalker, item.index)
      setSelectedItem(focusedWalker.hatWearables![item.category])
      
    }

    const handleRemoveItem = (category: string) => {
      const focusedWalker = Walker.focusedWalker
      if(!focusedWalker) return
      if(!focusedWalker.hatWearables) return
      const item = focusedWalker.hatWearables[category]
      if(item){
        setSelectedItem(null)
        Wearable.dispose(item)
        delete focusedWalker.hatWearables[category]
      }
    }

    React.useEffect(() => {
      if(selectedCategory){
        const focusedWalker = Walker.focusedWalker
        if(!focusedWalker) return
        if(!focusedWalker.hatWearables) return
        const item = focusedWalker.hatWearables[selectedCategory]
        if(item){
          setSelectedItem(item)
        }
      }
    },[selectedCategory])

    return(
            <div
      className={cn("WearableContainer flex gap-1 w-[60%] lg:w-[32%] min-w-[383px] h-[250px] z-[11]",
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      )}
    >
      {/**
       * Categories aside
       */}
  <aside className="w-1/3 h-full bg-black/40 backdrop-blur-md rounded gap-2 text-white flex flex-col">
    <h2 className="text-lg font-bold p-4">Wearables</h2>
    <div className="overflow-y-auto overflow-x-hidden flex-1">
      <ul className="flex flex-col gap-2 px-3">
        {Object.entries(ITEMS_BY_CATEGORY).map(([key,value])=>{
            return <li key={key} data-active={selectedCategory==key}
              onClick={()=>setSelectedCategory(key)}
            className="cursor-pointer hover:bg-gray-700 p-2 rounded data-[active=true]:bg-gray-700">{key}</li>
        })}
      </ul>
    </div>
  </aside>
      <main className="w-2/3 h-full overflow-y-scroll bg-black/40 rounded">
        <div className="grid grid-cols-3 gap-2 content-start p-3">
          {ITEMS_BY_CATEGORY[selectedCategory].map((item, index) => {
            const itemData = item
            const isActive = selectedItem?.wearableData.category == itemData.category && selectedItem?.wearableData.name == itemData.name
            return (
              <div
                key={index}
                title={itemData.name}
                data-active={isActive}
                className="w-full data-[active=true]:bg-white/50 aspect-auto backdrop-opacity-90 backdrop-blur-lg rounded-lg p-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700"
                onClick={() => {
                  if(isActive){
                    return handleRemoveItem(itemData.category)
                  }
                  handleSelectItem(itemData)
                }}
              >
                <img src={itemData.imageUrl} alt={itemData.name} className=" object-cover rounded-lg" />
                <div className="w-full overflow-hidden"><p className="text-white text-center text-sm text-ellipsis">{itemData.name}</p></div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
    )
}