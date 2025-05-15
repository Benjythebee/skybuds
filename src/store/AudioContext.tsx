import { Voices } from "../lib/voices";
import { create } from "zustand";


export const useAudioContext = create<{
    _voices:Voices,
    ready:boolean,
    play:(name:string)=>void
    playRandomConversation:()=>void
}>((set,get) => ({
    _voices:new Voices(),
    ready:!!get()?._voices?.ready,
    play:(name:string)=>{
        get()?._voices?.playVoice(name)
    },
    playRandomConversation:()=>{
        get()?._voices?.playRandomConversation()
    }
}))
