import { create } from "zustand"


export const useWearableOverlayStore = create<{
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}>((set)=>{
    return {
        isOpen: false,
        setOpen: (isOpen) => set({ isOpen })
    }
})
