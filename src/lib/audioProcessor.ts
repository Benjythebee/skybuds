import { useAudioContext } from "../store/AudioContext";
import { gui } from "./config";

/***
 * =============================
 *  AUDIO CONFIGURATION
 * =============================
 */
const folder = gui.addFolder( 'Audio' );

export const audioParameters = {
    masterGain:0.22,
    delayTime:0.0,
    echoFeedback:0.05,
    pitchFactor:1.44,
    play:()=>{
        useAudioContext.getState().playRandomConversation()
    }
};

const onAudioUpdate = ()=>{
    useAudioContext.getState()._voices.audioProcessor.updateParameters({
        masterGain:audioParameters.masterGain,
        delayTime:audioParameters.delayTime,
        echoFeedback:audioParameters.echoFeedback,
        globalPitch:audioParameters.pitchFactor,
    })
}

folder.add(audioParameters, 'masterGain', 0, 1).name('Master Gain').onChange(onAudioUpdate)
folder.add(audioParameters, 'delayTime', 0, 1).name('Delay Time').onChange(onAudioUpdate)
folder.add(audioParameters, 'echoFeedback', 0, 1).name('Echo Feedback').onChange(onAudioUpdate)
folder.add(audioParameters, 'pitchFactor', 0.5, 2).name('Pitch Factor').onChange(onAudioUpdate)
folder.add(audioParameters, 'play').name('Play Random Dialogue')
// Audio context for processing
export default class AudioProcessor {
    private context: AudioContext;
    private masterGain: GainNode;
    private convolver: ConvolverNode;
    private delay: DelayNode;
    private feedback: GainNode;
    private compressor: DynamicsCompressorNode;
    // Default pitch shift value (1.0 = no change, >1.0 = higher pitch, <1.0 = lower pitch)
    private globalPitchShift: number = 1.44;
    // Constants for pitch range
    private readonly MIN_PITCH = 0.5;  // An octave lower
    private readonly MAX_PITCH = 2.0;  // An octave higher

    
    constructor() {
        this.context = new AudioContext();
        
        // Create master gain node
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = audioParameters.masterGain; // Adjust overall volume
        
        // Create convolver for spatial reverb
        this.convolver = this.context.createConvolver();

        // // Create delay node for echo effect
        this.delay = this.context.createDelay(1.1);
        this.delay.delayTime.value = audioParameters.delayTime; // 300ms delay for slight echo
        
        // Create feedback for the echo
        this.feedback = this.context.createGain();
        this.feedback.gain.value = audioParameters.echoFeedback; // Echo volume (0.2 = subtle)
        
        // Create compressor to prevent clipping
        this.compressor = this.context.createDynamicsCompressor();
        
        // Connect nodes
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);
        
        this.masterGain.connect(this.convolver);
        this.convolver.connect(this.compressor);
        this.masterGain.connect(this.delay);
        this.delay.connect(this.compressor);
        this.compressor.connect(this.context.destination);
        
        // Generate impulse response for "vast plain" effect
        this.generateImpulseResponse();
    }
    
    // Create a custom impulse response for the convolver
    private async generateImpulseResponse(): Promise<void> {
        const sampleRate = this.context.sampleRate;
        const length = 2 * sampleRate; // 2 seconds
        const impulse = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            
            // Create a decay curve characteristic of a vast open space
            for (let i = 0; i < length; i++) {
                // Initial sharp reflection followed by exponential decay
                const decay = Math.exp(-i / (sampleRate * 0.2)); // Decay time 0.2s
                
                if (i < 0.01 * sampleRate) {
                    // Initial reflection
                    channelData[i] = (Math.random() * 2 - 1) * decay * 0.6;
                } else {
                    // Sparse later reflections
                    channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
                }
            }
        }
        
        this.convolver.buffer = impulse;
    }
    
    // Process an audio element through our effects chain
    processAudio(audioElement: HTMLAudioElement): MediaElementAudioSourceNode {
        // Ensure context is running (needed due to autoplay restrictions)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Apply pitch shift to the audio element's playback rate
        // This combines the global pitch shift with the individual voice's pitch factor
        audioElement.preservesPitch = false; // Allow pitch to change with playback rate
        audioElement.playbackRate = this.globalPitchShift

        const source = this.context.createMediaElementSource(audioElement);
        source.connect(this.masterGain);
        
        return source;
    }

    // Set global pitch shift for all voices
    setGlobalPitchShift(pitchFactor: number): void {
        const safePitch = Math.max(this.MIN_PITCH, Math.min(pitchFactor, this.MAX_PITCH));
        this.globalPitchShift = safePitch;
        // Note: This will apply to newly played voices, not currently playing ones
    }
    getGlobalPitchShift(): number {
        return this.globalPitchShift;
    }
    updateParameters(props:Partial<{
        delayTime: number,
        echoFeedback: number,
        masterGain: number
        globalPitch: number
    }>) {
        if (props.delayTime !== undefined) {
            this.delay.delayTime.value = props.delayTime;
        }
        if (props.echoFeedback !== undefined) {
            this.feedback.gain.value = props.echoFeedback;
        }
        if (props.masterGain !== undefined) {
            this.masterGain.gain.value = props.masterGain;
        }
        if (props.globalPitch !== undefined) {
            this.setGlobalPitchShift(props.globalPitch);
        }
    }

    // Resume audio context (call this on user interaction)
    resume(): void {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
}
