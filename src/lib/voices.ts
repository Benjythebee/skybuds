import { VoiceJSONTYPE } from 'voice.type';
import voiceJson from '../data/voices.json';
import AudioProcessor from './audioProcessor';
const typedVoiceJson = voiceJson as VoiceJSONTYPE

type voiceData = VoiceJSONTYPE[keyof VoiceJSONTYPE][number]

type PlayableVoiceObject = {
    voice:Voice
    isConversation:boolean
}


export class Voices {

    audioElements: HTMLAudioElement[] = [];
    voices: Voice[] = [];
    voiceByNameMap: Map<string, Voice> = new Map();
    voiceByLanguageMap: Map<string, Voice[]> = new Map();
    queue: PlayableVoiceObject[] = [];

    currentlyPlaying: PlayableVoiceObject | null = null;
    audioProcessor: AudioProcessor;
    updateInterval: NodeJS.Timeout | null = null;

    ready = false;
    timeSinceLastAudio: number = Date.now();
    lastAudioWasConversation: number = Date.now();


    constructor(){
        this.audioProcessor = new AudioProcessor();
        for(const [language,values] of Object.entries(typedVoiceJson)) {
            if(values.length === 0) continue;
            for(const input of values) {
                const audio = new Voice(this,input);
                this.voices.push(audio);
                this.voiceByNameMap.set(input.title, audio);
                if(!this.voiceByLanguageMap.has(language)) {
                    this.voiceByLanguageMap.set(language, []);
                }else{
                    const list = this.voiceByLanguageMap.get(language)!;
                    list.push(audio);
                }
            }
        }

        this.updateInterval = setInterval(this.update, 60); // 100 ms
        this.ready = true;


        // listen to interactions on document to unmute all audio elements
        document.addEventListener('click', this.unmuteAllAudioElements);
        document.addEventListener('touchstart', this.unmuteAllAudioElements);
    }

    unmuteAllAudioElements = () => {
        // Resume audio context
        this.audioProcessor.resume();
        this.voices.forEach(voice => {
            if(voice.audioElement) {
                voice.audioElement.muted = false;
            }
        });
        document.removeEventListener('click', this.unmuteAllAudioElements);
        document.removeEventListener('touchstart', this.unmuteAllAudioElements);
    }

    
    playVoice(name:string) {
        if(this.currentlyPlaying) {
            this.currentlyPlaying.voice.stop();
            this.currentlyPlaying = null;
        }
        const voice = this.voiceByNameMap.get(name);
        if(voice) {
            this.queue.push({
                voice:voice,
                isConversation:false
            });
        } else {
            console.warn(`Voice ${name} not found`);
        }
    }

    playRandomConversation() {
        if(this.currentlyPlaying) {
            /**
             *  Don't interrupt the current voice
             */
            return
        }
        const languages = Array.from(this.voiceByLanguageMap.keys());
        const randomLanguageIndex = Math.floor(Math.random() * languages.length);
        const voices = this.voiceByLanguageMap.get(languages[randomLanguageIndex]) || []
        // Get two random indexes, ensuring they are different, if array is less than 2, return 
        if(voices.length < 2) {
            console.warn(`Not enough languages to play a random conversation`);
            return;
        }
        const randomIndex1 = Math.floor(Math.random() * voices.length);
        let randomIndex2 = Math.floor(Math.random() * voices.length);
        while(randomIndex1 === randomIndex2) {
            randomIndex2 = Math.floor(Math.random() * voices.length);
        }
        
        const randomVoices = [voices[randomIndex1], voices[randomIndex2]];
        if(randomVoices.length > 0) {
            this.queue.push({
                voice:randomVoices[0],
                isConversation:true
            },{
                voice:randomVoices[1],
                isConversation:false
            }
        );
        } else {
            console.warn(`Voices not found`);
        }
    }

    updateQueue =()=>{
        if(this.queue.length === 0) return;
        const nextInQueue = this.queue.shift();
        if(nextInQueue) {
            this.currentlyPlaying = nextInQueue;
            nextInQueue.voice.play();
        }else{
            this.currentlyPlaying = null;
        }
    }

    update=()=>{
       
        if(!this.currentlyPlaying){
            if (this.timeSinceLastAudio +(5*1000) < Date.now()) {
                this.updateQueue();
            }
            return
        }
        
        if(!this.currentlyPlaying.voice.isPlaying()) {
            this.timeSinceLastAudio = Date.now()
            this.currentlyPlaying.voice.stop();


            if(this.currentlyPlaying.isConversation){
                this.updateQueue();
                return
            }

            this.currentlyPlaying = null;
        }
    }
}

export class Voice {
    audioElement: HTMLAudioElement = null!;
    private audioSource: MediaElementAudioSourceNode = null!;
    constructor(public voices:Voices, public voiceData:voiceData){
        this.preloadSound(voiceData.path!);
    }

    get audioProcessor(){
        return this.voices.audioProcessor;
    }

    preloadSound(src:string) {
        const sound = document.createElement("audio");
        sound.muted = true; // Mute the audio element to avoid autoplay restrictions
        sound.autoplay = false;
        sound.src = src;
        this.audioElement = sound;
        this.audioElement.volume = 0.2; // Set the volume to a reasonable level
        document.body.appendChild(sound);
        return sound;
    }

    play() {
        if(!this.audioElement) return;
        this.audioElement.muted = false; // Unmute the audio element
        
        // Only create the audio source node once
        if (!this.audioSource) {
            this.audioSource = this.voices.audioProcessor.processAudio(this.audioElement);
        }
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch((error) => {
            console.error("Error playing audio:", error);
        });

    }

    pause() {
        if(!this.audioElement) return;
        this.audioElement.pause();
    }
    stop() {
        if(!this.audioElement) return;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.muted = true; // Mute the audio element again
    }

    isPlaying() {
        if(!this.audioElement) return false;
        return !this.audioElement.paused && !this.audioElement.ended && this.audioElement.currentTime > 0;
    }
}