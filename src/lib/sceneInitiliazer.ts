//@ts-ignore
import Stats from 'stats.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { World } from './World'
import { Walker } from './Walker'
import { Wearable } from './wearables/Wearable'
import { isViewMode } from './utils/featureFlags'

export const CONSTANTS= {
	maxDistance: 40,
	minDistance: 1
}

export function sceneInitializer(
) {

	//"editor-scene"
	const canvasRef = document.getElementById('canvas-render') as HTMLCanvasElement
	if (!canvasRef) throw new Error('Canvas not found')
        console.log('canvasRef',canvasRef)
	const isDebug = window?.location.search.includes('debug')
	let stats:Stats = null!
	// if (isDebug) {
		stats = new Stats();
		stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild( stats.dom );
	// }

	const scene = new THREE.Scene()

	scene.environmentIntensity = 0.5

	// const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
	// scene.add(ambientLight)

	// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
	// // rotate the directional light to be a key light
	// directionalLight.position.set(0, 1.5, 0.5)
	// directionalLight.castShadow = true
	// directionalLight.shadow.mapSize.width = 512
	// directionalLight.shadow.mapSize.height = 512

	// const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
	// // rotate the directional light to be a key light
	// directionalLight2.position.set(0, 3, 1)
	// directionalLight2.target.position.set(0, 1.5, 0)
	// directionalLight2.castShadow = true
	// directionalLight2.shadow.mapSize.width = 512
	// directionalLight2.shadow.mapSize.height = 512
	// directionalLight2.shadow.radius = 1.0
	// directionalLight2.shadow.bias = -0.005;

	// scene.add(directionalLight,directionalLight2)

	const camera = new THREE.PerspectiveCamera(
		30,
		canvasRef.clientWidth / canvasRef.clientHeight,
		0.1,
		500,
	);
	
	const renderer = new THREE.WebGLRenderer({
		canvas: canvasRef,
		antialias: true,
		alpha: true,
		preserveDrawingBuffer: true,
	})

	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.toneMappingExposure = 1.0
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
    camera.position.set(0, 2*4, 5*5)
	camera.near = 0.01
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.minDistance = CONSTANTS.minDistance
	controls.maxDistance = CONSTANTS.maxDistance
    controls.autoRotate = isViewMode

	if(isViewMode){
		controls.maxDistance = 30
		controls.rotateSpeed = 0.5
		controls.autoRotateSpeed = 0.5
		controls.maxPolarAngle = (Math.PI / 2)
	}

	controls.enablePan =true

	controls.enableZoom =true

	controls.target = new THREE.Vector3(0, 2, 0)
	controls.enableDamping = true
	controls.dampingFactor = 0.1

	camera.userData={
		initPosition:camera.position.clone(),
		initRotation:camera.rotation.clone(),
		controlTarget:controls.target.clone(),
	}
	const handleResize = () => {
		renderer.setSize(window.innerWidth, window.innerHeight)
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
	}
	handleResize()
	window.addEventListener('resize', handleResize)
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.outputColorSpace = THREE.SRGBColorSpace
	renderer.clearColor()
	renderer.setClearColor(0x000000, 0)

	const clock = new THREE.Clock()
	const world = new World(scene,controls,camera)
	world.load()

	const frustrum = new THREE.Frustum()
	Walker.frustrum = frustrum
	let matrix = new THREE.Matrix4()
	const animate = () => {
		stats && stats.begin()

		requestAnimationFrame(animate)
		frustrum.setFromProjectionMatrix(
			matrix.multiplyMatrices(
				camera.projectionMatrix,
				camera.matrixWorldInverse
			)
		)
		const delta = clock.getDelta()

		controls?.update(delta)
		world.update(delta)
		Wearable.updateAll()
		renderer.render(scene, camera)
		stats && stats.end()
	}

	animate()
	Walker.loadRoot(scene)

	const handleMouseClick = (event: MouseEvent)=>{
		const rect = canvasRef.getBoundingClientRect()
		const mousex = ((event.clientX - rect.left) / rect.width) * 2 - 1
		const mousey = -((event.clientY - rect.top) / rect.height) * 2 + 1
		Walker.pickFromMouseClick(mousex,mousey)
	}
	if(!isViewMode){
		canvasRef.addEventListener('click', handleMouseClick)
	}


	return {
		scene,
		camera,
        world,
		controls,
		sceneElements:scene,
		clock,
	}
}

const min = new THREE.Vector3(0, 0.0, 0)
const max = new THREE.Vector3(0, 1.6, 0)

// const setTarget = (controls:OrbitControls,scene:THREE.Scene)=>{
// 	if(!controls) return

// 	const target = controls.target.clone()
// 	const distance = controls.getDistance()
// 	// console.log('distance',distance)
// 	let maxDistance = controls.maxDistance
// 	let minDistance = controls.minDistance
// 	if(maxDistance === minDistance) {
// 		maxDistance = CONSTANTS.maxDistance
// 		minDistance = CONSTANTS.minDistance
// 	}
// 	// get the lerp ratio of distance between min and max distance
// 	const ratio = (distance - minDistance) / (maxDistance - minDistance)
	
// 	const newTarget = new THREE.Vector3(0, min.y + (max.y-min.y) * (1-ratio), 0)
// 	if(newTarget.y === target.y) return

// 	// move the trget y position to the camera y position
// 	controls.target.y = newTarget.y

// }
