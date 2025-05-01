import { create } from "zustand";


export const useViewContext = create<{
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
}>((set) => ({
    isLoading: false,
    setLoading: (isLoading) => set({ isLoading }),
}))