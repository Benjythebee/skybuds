import { AnimationAction, AnimationClip, AnimationMixer, LoopOnce, LoopRepeat } from "three";
import { CharacterState, Walker } from "./Walker";
import { GLTF } from "three/examples/jsm/Addons.js";

const excludedBones = new Set(['Armature',
  'mixamorigLeftHand', 'mixamorigLeftHandThumb1', 'mixamorigLeftHandThumb2', 'mixamorigLeftHandThumb3',
  'mixamorigLeftHandIndex1', 'mixamorigLeftHandIndex2', 'mixamorigLeftHandIndex3',
  'mixamorigLeftHandMiddle1', 'mixamorigLeftHandMiddle2', 'mixamorigLeftHandMiddle3',
  'mixamorigLeftHandRing1', 'mixamorigLeftHandRing2', 'mixamorigLeftHandRing3',
  'mixamorigLeftHandPinky1', 'mixamorigLeftHandPinky2', 'mixamorigLeftHandPinky3',
  'mixamorigRightHand', 'mixamorigRightHandThumb1', 'mixamorigRightHandThumb2', 'mixamorigRightHandThumb3',
  'mixamorigRightHandIndex1', 'mixamorigRightHandIndex2', 'mixamorigRightHandIndex3',
  'mixamorigRightHandMiddle1', 'mixamorigRightHandMiddle2', 'mixamorigRightHandMiddle3',
  'mixamorigRightHandRing1', 'mixamorigRightHandRing2', 'mixamorigRightHandRing3',
  'mixamorigRightHandPinky1', 'mixamorigRightHandPinky2', 'mixamorigRightHandPinky3',
  'mixamorigLeftFoot', 'mixamorigLeftToeBase', 'mixamorigRightFoot', 'mixamorigRightToeBase'
]);

/**
 * Interface for character instance data
 */
interface CharacterData {
    mixer: AnimationMixer;
    actions: Map<CharacterState, AnimationAction>;
    hipPositionNudge?: number;
    currentAction: AnimationAction | null;
  }


export class AnimationManager {

    private animations: Map<CharacterState, AnimationClip> = new Map();
    public characterDataMap: Map<Walker, CharacterData> = new Map();
    constructor(){

    }

    setGLTFAnimations(gltf:GLTF){
        // Store animations
        gltf.animations.forEach(clip => {
            // Look for animation names that match our states
            for (const state of Object.values(CharacterState)) {
              if (clip.name.toLowerCase().includes(state.toLowerCase())) {
                clip.tracks.map((track, index) => {
                  if(Array.from(excludedBones).includes(track.name.split('.')[0])){
                    clip.tracks.splice(index, 1)
                  }
                })

                if(clip.name.toLowerCase().includes('sit')){
                  clip.tracks.forEach((track) => {
                    if (track.name.includes('hips') && track.name.includes('position')) {
                      const yOffset = track.values[1];
                      const newValues = track.values.map((value, i) => {
                        if (i % 3 === 1) {
                          return value - (yOffset+0.01); // Adjust Y position
                        }
                        return value;
                      });
                      track.values = newValues;
                    }
                  });
                }

                this.animations.set(state, clip);
                break;
              }
            }
          });
    }

    updateSpeed(walker: Walker, speed: number) {
        const instance = this.characterDataMap.get(walker);
        if (!instance) {
          console.warn(`Instance ${walker.id} not found`);
          return;
        }
        instance.actions.forEach((action) => {
            action.setEffectiveTimeScale(speed*2.8);
        });
    }

    addCharacter(walker: Walker,initialState: CharacterState | null = null, options?:{speed?:number}) {
        const mixer = new AnimationMixer(walker.mesh);
        const actions = new Map<CharacterState, AnimationAction>();
        let currentAction: AnimationAction | null = null;
        // Create animation actions for each animation
        this.animations.forEach((clip, state) => {
            const action = mixer.clipAction(clip);
            if(options?.speed){
               // Speed is between the amount of unit we cover in DELTA time. 
                // 1 unit per second is the default speed. 0.5 is half speed, 2 is double speed.
                  action.setEffectiveTimeScale(options.speed*2.8);
            }
            action.enabled = true;
            actions.set(state, action);
        });
        // Set initial state to provided value, WALKING, or first available
        let startState = initialState || CharacterState.WALKING;
        let startAction = actions.get(startState);

        // If requested state isn't available, use first available
        if (!startAction && actions.size > 0) {
            const firstState = Array.from(actions.keys())[0];
            startState = firstState;
            startAction = actions.get(firstState);
        }
        if (startAction) {
            startAction.play();
            currentAction = startAction;
          }

        this.characterDataMap.set(walker, { mixer, actions, currentAction });
    }

    removeCharacter(walker: Walker) {
        const instance = this.characterDataMap.get(walker);
        if (!instance) {
          console.warn(`Instance ${walker.id} not found`);
          return;
        }
        // Stop all actions
        instance.actions.forEach((action) => {
          action.stop();
        });
        // Remove the character from the map
        this.characterDataMap.delete(walker);
    }

    _tempAnimData:{
      prevState: CharacterState | null;
    } = {prevState:null};
    pauseAnimationAtFrame(walker: Walker, state: CharacterState, frame: number) {
        const instance = this.characterDataMap.get(walker);
        if (!instance) {
          console.warn(`Instance ${walker.id} not found`);
          return;
        }
        const nextAction = instance.actions.get(state);
        if (!nextAction) {
          console.warn(`Animation state ${state} not found for instance ${walker.id}`);
          return;
        }

        const currentAction = instance.currentAction;
        if(currentAction) {
          currentAction.setEffectiveTimeScale(0);
          currentAction.setEffectiveWeight(0);
        }

        this._tempAnimData.prevState = walker.currentState
        walker.currentState = state;
        instance.currentAction = nextAction;
        nextAction.reset();
        nextAction.setEffectiveTimeScale(1);
        nextAction.setEffectiveWeight(1);
        nextAction.play();
        nextAction.time =frame; // Adjust time based on frame
        nextAction.timeScale = 0; // Pause the animation
    }

    continueAnimation(walker: Walker) {
      if(!this._tempAnimData.prevState) return;
        const instance = this.characterDataMap.get(walker);
        if(!instance) {
          return
        }
        const currentAction = instance.currentAction;

        if(currentAction) {
          currentAction.setEffectiveTimeScale(0);
          currentAction.setEffectiveWeight(0);
        }

        // Re-apply the previous state
        walker.currentState = this._tempAnimData.prevState;
        this.setCharacterState(walker, this._tempAnimData.prevState, 0.01);
        this._tempAnimData.prevState = null;
    }


    getAnimationDuration(Characterstate:CharacterState): number {
        const anim = this.animations.get(Characterstate);
        if(!anim) return 0;
        const duration = anim.duration;
        return duration;
    }

    setCharacterState(walker: Walker, state: CharacterState, transitionDuration: number = 0.5): void {
        const instance = this.characterDataMap.get(walker);
        if (!instance) {
          console.warn(`Instance ${walker.id} not found`);
          return;
        }
        const newAction = instance.actions.get(state);
        if (!newAction) {
          console.warn(`Animation state ${state} not found for instance ${walker.id}`);
          return;
        }
        

        // If there is a current action, transition from it
        if (instance.currentAction) {
          // Start transitioning to the new action
          newAction.reset();
          newAction.setEffectiveTimeScale(1);
          newAction.setEffectiveWeight(1);
          // newAction.fadeIn(transitionDuration);
          instance.currentAction.crossFadeTo(newAction, transitionDuration, false);
          newAction.play();
        } else {
          // Just play the new action
          newAction.play();
        }
        

        // Update instance state
        instance.currentAction = newAction;
        
      }


}