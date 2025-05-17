import { create } from "zustand";


export const useViewContext = create<{
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
    setIsGuest: (isGuest: boolean) => void;
    isGuest: boolean;
}>((set) => ({
    isLoading: false,
    isGuest: false,
    setIsGuest: (isGuest) => set({ isGuest }),
    setLoading: (isLoading) => set({ isLoading }),
}))