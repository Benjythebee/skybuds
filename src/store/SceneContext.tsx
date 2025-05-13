import gsap from 'gsap'
import React, { createContext, useCallback,  useEffect,  useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CONSTANTS, sceneInitializer } from '../lib/sceneInitiliazer'
import { World } from 'lib/World'
import { ScreenshotManager } from 'lib/screenshotManager'

export type SceneContextType = {
	world: World
	scene: THREE.Scene
	screenshotManager: ScreenshotManager
	camera: THREE.Camera
	dispose: () => void
	moveCamera: (value: {
		// left half center
		targetX?: number
		targetY?: number
		targetZ?: number
		distance?: number
	}) => void
	controls: OrbitControls
	sceneElements: THREE.Object3D<any>
}

export const SceneContext = createContext({
	world: null!,
	init: null,
	scene: null!,
	camera: null!,
	screenshotManager: null!,
	dispose: () => {},
	moveCamera: (_value: {
		// left half center
		targetX?: number
		targetY?: number
		targetZ?: number
		distance?: number
	}) => {},
	controls: null!,
	sceneElements: null!,
} as SceneContextType)

export const SceneProvider = ({ children }: { children?: React.ReactNode }) => {

	const [sceneElements, setSceneElements] = useState<THREE.Object3D<any>>(null!)
    const [world, setWorld] = useState<World>(null!)
	const [scene, setScene] = useState<THREE.Scene>(null!)
	const [camera, setCamera] = useState<THREE.Camera>(null!)
	const [controls, setControls] = useState<OrbitControls>(null!)
	const [screenshotManager, setScreenshotManager] = useState<ScreenshotManager>(null!)
	let loaded = false

	React.useEffect(() => {
			if (scene && scene.visible) return
			if (loaded) return
			loaded = true
			console.log('init scene')
			const {
				scene: scene_,
				camera: camera_,
				controls: controls_,
				world: world_,
				sceneElements: sceneElements_,
			} = sceneInitializer()
			setCamera(camera_)
			setScene(scene_)
			setControls(controls_)
			setScreenshotManager(new ScreenshotManager(scene_))
			setSceneElements(sceneElements_)
			setWorld(world_)
		
		return () => {
			loaded = false
			if (scene_) {
				scene_.clear()
				scene_.visible = false
			}
			if (camera_) {
				camera_.clear()
				camera_.visible = false
			}
			if (controls_) {
				controls_.dispose()
			}

		}
	},[])

    const moveCamera = (value:{
        // left half center
        targetX?: number,
        targetY?: number,
        targetZ?: number,
        distance?: number,
      }) => {
        if (!controls) return
        gsap.to(controls.target, {
          x: value.targetX ?? 0,
          y: value.targetY ?? 0,
          z: value.targetZ ?? 0,
          duration: 1,
        })
    
        gsap
          .fromTo(
            controls,
            {
              maxDistance: controls.getDistance(),
              minDistance: controls.getDistance(),
              minPolarAngle: controls.getPolarAngle(),
              maxPolarAngle: controls.getPolarAngle(),
              minAzimuthAngle: controls.getAzimuthalAngle(),
              maxAzimuthAngle: controls.getAzimuthalAngle(),
            },
            {
              maxDistance: value.distance,
              minDistance: value.distance,
              minPolarAngle: Math.PI / 2 - 0.11,
              maxPolarAngle: Math.PI / 2 - 0.11,
              minAzimuthAngle: -0.78,
              maxAzimuthAngle: -0.78,
              duration: 1,
            },
          )
          .then(() => {
            controls.minPolarAngle = 0
            controls.maxPolarAngle = 3.1415
            controls.minDistance = 0.5
            controls.maxDistance = 10
            controls.minAzimuthAngle = Infinity
            controls.maxAzimuthAngle = Infinity
          })
      }
    
	const dispose = () => {
		console.log('dispose scene')
		if(scene){
			scene?.clear()
			scene.visible = false
		}
	}

	return (
		<SceneContext.Provider
			value={{
				world,
				scene,
				screenshotManager,
				camera,
				moveCamera,
				dispose,
				controls,
				sceneElements,
			}}
		>
			{children}
		</SceneContext.Provider>
	)
}

export const useSceneContext = () => React.useContext(SceneContext)
