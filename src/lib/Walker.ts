import {
  ArrowHelper,
  Box3,
  BoxGeometry,
  Group,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  Raycaster,
  Scene,
  Object3D,
  Vector3,
  Box3Helper,
  PerspectiveCamera,
  Frustum,
  Bone,
  Vector2,
  Euler,
  Clock
} from 'three'
import { World, worldParameters } from './World'
import { GLTFLoader, SkeletonUtils } from 'three/examples/jsm/Addons.js'
import { gui } from './config'
import { AnimationManager } from './animationManager'
import { EventEmitter } from 'events'
import { Wearable } from './wearables/Wearable'
import { isViewMode } from './utils/featureFlags'
import { applyTransforms, gaussianRandom } from './utils/utils'
import { SpeechBubble } from './SpeechBubble'
import { HandheldLantern } from './wearables/HandheldLantern'

const conversationalHellos = [
  'Hello!',
  'Hi there!',
  'Greetings!',
  'Howdy!',
  "What's up?",
  'Hey!',
  'Salutations!',
  'Bonjour!',
  'Hola!',
  'Ciao!'
]
/***
 * =============================
 *  WALKERS CONFIGURATIONS
 * =============================
 */
const folder1 = gui.addFolder('Walkers')
export const walkerConfigurations = {
  debug: false,
  addWalker: () => {
    Walker.create(World.instance)
  },
  removeWalker: () => {
    Walker.removeWalker(Walker.walkers.length - 1)
  },
  createSpeechBubble: () => {
    if (Walker.focusedWalker) {
      if (Walker.focusedWalker) {
        const speechBubble = new SpeechBubble('. . .')
        Walker.focusedWalker.scene.add(speechBubble.getSprite())
        speechBubble.followObject(Walker.focusedWalker.object)
        Walker.focusedWalker.speechBubble = speechBubble
      }
    }
  },
  focusedWalker: 0,
  wearableId: '0',
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0
}

const onToggleDebug = (value: boolean) => {
  Walker.toggleDebug()
}

const onHandleWearableChange = (label: 'x' | 'y' | 'z') => (value: number) => {
  if (Walker.focusedWalker) {
    const id = parseInt(walkerConfigurations.wearableId)
    if (isNaN(id)) return

    const nudgeRot = new Euler()
    nudgeRot[label] = value
    const wearable = Wearable.roots[id as keyof typeof Wearable.roots]
    if (wearable) {
      wearable.rotation.x = nudgeRot.x
      wearable.rotation.y = nudgeRot.y
      wearable.rotation.z = nudgeRot.z
      applyTransforms(wearable)
    }
  }
}

folder1.add(walkerConfigurations, 'debug').name('Debug').onChange(onToggleDebug)
folder1.add(walkerConfigurations, 'addWalker').name('Add Walker')
folder1.add(walkerConfigurations, 'removeWalker').name('Remove Walker')
folder1
  .add(walkerConfigurations, 'createSpeechBubble')
  .name('Create Speech Bubble')
folder1
  .add(walkerConfigurations, 'focusedWalker')
  .name('Focused Walker')
  .listen()
  .disable()
folder1.add(walkerConfigurations, 'wearableId').name('Wearable ID').min(1)
const folderRotation = folder1.addFolder('Rotation')
folderRotation
  .add(walkerConfigurations, 'rotationX')
  .name('X')
  .onFinishChange(onHandleWearableChange('x'))
folderRotation
  .add(walkerConfigurations, 'rotationY')
  .name('Y')
  .onFinishChange(onHandleWearableChange('y'))
folderRotation
  .add(walkerConfigurations, 'rotationZ')
  .name('Z')
  .onFinishChange(onHandleWearableChange('z'))
folder1.open()

/**
 * Available animation states for characters
 */
export enum CharacterState {
  IDLE = 'Idle',
  WAVING = 'Waving',
  WALKING = 'Walking',
  WALKINGWITH = "Walkingwith",
  SITTING = 'Sitting',
  TALKING = 'Talking'
}

const states: Record<CharacterState, { duration?: number; loop: boolean }> = {
  [CharacterState.IDLE]: {
    duration: 1.5,
    loop: true
  },
  [CharacterState.WAVING]: {
    loop: false
  },
  [CharacterState.WALKING]: {
    loop: true
  },
  [CharacterState.WALKINGWITH]: {
    loop: true
  },
  [CharacterState.SITTING]: {
    duration: 5,
    loop: true
  },
  [CharacterState.TALKING]: {
    duration: 1.5,
    loop: true
  }
}
type WalkerMetaInfo = {
  name: string
  talkative: boolean
  laziness: number
  tokenId: number
  speed: number
  image_url: string
  color: number
  creator: string
  description: string
}

type walkerParams = {
  cube: Object3D
  mesh: SkinnedMesh
  direction: Vector3
  walkerMeta: WalkerMetaInfo
  boundingBox: Box3 | null
  walkerInfo?: WalkerMetaInfo
}

const mouse = new Vector2()

export class Walker {
  static size = 0.5 //overwritten
  static rootBoundingBox = new Box3()
  static scale = 0.3
  static walkers: Walker[] = []
  static rootCharacter: Object3D = null!
  static loaderManager: LoadingManager = new LoadingManager()
  static gltfLoader: GLTFLoader = new GLTFLoader(this.loaderManager)
  static clickRayCast: Raycaster = new Raycaster()
  static events: EventEmitter = new EventEmitter()
  static frustrum: Frustum = new Frustum()
  id: number
  object: Object3D
  mesh: SkinnedMesh
  direction: Vector3
  paused: boolean = false
  boundingBox: Box3 | null
  raycaster: Raycaster = new Raycaster()
  currentState: CharacterState = CharacterState.WALKING
  lastConversationTime = Date.now()

  walkerInfo: WalkerMetaInfo = {
    name: 'Skybud #000',
    color: Math.random() * 0xffffff,
    tokenId: 0,
    talkative: true,
    laziness: 0.2,
    speed: 0.1,
    image_url: '',
    creator: 'unknown',
    description: 'A Skybud'
  }

  collisionRayCasters = [new Raycaster(), new Raycaster()]
  collisionMesh: Mesh

  hatWearables: Record<string, Wearable> | null = null
  handheldLantern: HandheldLantern
  static collisionMaterial = new MeshStandardMaterial({
    color: 0xff0000,
    visible: false,
    transparent: true,
    opacity: 0.5
  })

  debugRayCaster: Raycaster = new Raycaster()

  static animationManager: AnimationManager = new AnimationManager()
  static clock: Clock = new Clock()
  static interval: NodeJS.Timeout | null = null

  rngInterval: NodeJS.Timeout | null = null
  private _sittingRNG = 0.5

  constructor(
    public world: World,
    props: walkerParams
  ) {
    this.id = Walker.walkers.length

    if (!Walker.interval) {
      Walker.interval = setInterval(() => {
        Walker.updateWalkers(Walker.clock.getDelta(), Walker.frustrum)
      }, 1000 / 30) // 30 fps
    }

    this.object = props.cube
    this.mesh = props.mesh
    this.direction = props.direction
    this.walkerInfo = props.walkerMeta
    this.boundingBox = props.boundingBox

    this.raycaster.far = 2
    this.directionHelper.visible = false
    this.collision1Helper.visible = false
    this.collision2Helper.visible = false
    // this.directionHelper.rotateOnAxis(new Vector3(0,1,0),Math.PI)
    this.object.add(this.directionHelper)
    this.object.add(this.collision1Helper)
    this.object.add(this.collision2Helper)
    // generate box geometry for collision detection; use boundingbox
    const geomData = {
      width: this.boundingBox!.max.x - this.boundingBox!.min.x,
      height: this.boundingBox!.max.y - this.boundingBox!.min.y,
      depth: this.boundingBox!.max.z - this.boundingBox!.min.z
    }
    geomData.width = ((geomData.width * 1) / Walker.scale) * 10
    geomData.height = ((geomData.height * 1) / Walker.scale) * 10
    geomData.depth = ((geomData.depth * 1) / Walker.scale) * 10
    const geometry = new BoxGeometry(
      geomData.width,
      geomData.height,
      geomData.depth
    )
    const collisionMaterial = Walker.collisionMaterial

    this.collisionMesh = new Mesh(geometry, collisionMaterial)
    this.collisionMesh.frustumCulled = false

    this.collisionMesh.position.set(0, 1, 0)
    ;(this.collisionMesh as any).walker = this

    // this.collisionMesh.rotation.copy(this.mesh.rotation)
    this.object.add(this.collisionMesh)
    this.collisionMesh.updateMatrixWorld(true)
    this.collisionMesh.updateMatrix()

    Walker.animationManager.addCharacter(this, this.currentState, {
      speed: this.speed
    })

    this.handheldLantern = new HandheldLantern(this.scene, this)

    this.rngInterval = setInterval(() => {
      const stdVariation = 0.15 + this.walkerInfo.laziness * 0.2
      this._sittingRNG = gaussianRandom(0.5, stdVariation)
    }, 2000)
  }

  get isMinted() {
    return this.walkerInfo.tokenId > 0
  }

  get speed() {
    return this.walkerInfo.speed
  }

  static hideAllWalkers(except: Walker[]) {
    Walker.walkers.forEach((walker) => {
      if (except.includes(walker)) return
      walker.object.visible = false
    })
  }

  static showAllWalkers() {
    Walker.walkers.forEach((walker) => {
      walker.object.visible = true
    })
  }

  updateSpeed(speed: number) {
    this.walkerInfo.speed = speed
    Walker.animationManager.updateSpeed(this, speed)
  }

  static async focusWalker(walker: Walker) {
    const camera = World.instance.camera as PerspectiveCamera

    this.focusedWalker = walker

    let worldPosition = new Vector3()
    walker.collisionMesh.getWorldPosition(worldPosition)
    worldPosition.add(new Vector3(0, Walker.size / 5, 0))

    //create mesh at new worldPosition
    await World.instance.moveCamera({
      targetX: worldPosition.x,
      targetY: worldPosition.y,
      targetZ: worldPosition.z,
      distance: 0.8
    })
    // // Make the walker face the camera
    const direction = new Vector3(
      camera.position.x - walker.object.position.x,
      0,
      camera.position.z - walker.object.position.z
    ).normalize()

    walker.direction.copy(direction)

    Walker.events.emit('walkerSelected', walker)
    walker.addStateToQueue(
      CharacterState.WAVING,
      { duration: 5, loop: false },
      true
    )
  }

  static focusedWalker: Walker | null = null
  static async pickFromMouseClick(mouseX: number, mouseY: number) {
    mouse.x = mouseX
    mouse.y = mouseY

    // Check if a walker is already focused
    if (this.focusedWalker) return

    const camera = World.instance.camera as PerspectiveCamera
    Walker.clickRayCast.setFromCamera(mouse, camera)
    const intersects = Walker.clickRayCast.intersectObjects(
      Walker.walkers.map((walker) => walker.collisionMesh),
      false
    )
    if (intersects.length > 0) {
      const walker = (intersects[0].object as any).walker as Walker
      this.focusWalker(walker)
    }
  }

  static async unFocusWalker() {
    if (this.focusedWalker) {
      this.focusedWalker = null
      this.events.emit('walkerUnselected')
      // Reset camera state
      const cameraInit = World.instance.camera.userData.initPosition.clone()
      const controlTarget = World.instance.camera.userData.controlTarget.clone()
      // World.instance.camera.position.set(cameraInit.position.x, cameraInit.position.y, cameraInit.position.z);
      await World.instance.moveCamera({
        targetX: controlTarget.x,
        targetY: controlTarget.y,
        targetZ: controlTarget.z,
        distance: 18
      })
      World.instance.controls.target = controlTarget
      World.instance.camera.position.set(
        cameraInit.x,
        cameraInit.y,
        cameraInit.z
      )
    }
  }

  static isDebug = false
  directionHelper: ArrowHelper = new ArrowHelper(
    this.raycaster.ray.direction,
    new Vector3(0, 1, 0),
    5,
    0xff0000
  )
  collision1Helper: ArrowHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(0, 1, 0),
    2.5,
    0xffff00
  )
  collision2Helper: ArrowHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(0, 1, 0),
    2.5,
    0x00ff00
  )
  static toggleDebug() {
    this.isDebug = walkerConfigurations.debug
    Walker.collisionMaterial.visible = walkerConfigurations.debug
    Walker.walkers.forEach((walker) => {
      walker.directionHelper!.visible = walkerConfigurations.debug
    })
  }

  get scene() {
    return this.world.scene as Scene
  }

  static async loadRoot(sceneRoot: Scene) {
    const assets = await Walker.gltfLoader.loadAsync('/assets/Character.glb')

    const newObjects = SkeletonUtils.clone(assets.scene)
    newObjects.frustumCulled = false
    // newObjects.position.set(0, -2, 0)

    newObjects.traverse((child) => {
      if ((child as SkinnedMesh).isSkinnedMesh) {
        child.name = 'character'
      }
    })

    // Store animations
    this.animationManager.setGLTFAnimations(assets)

    const skinnedMesh = newObjects.getObjectByName('character') as Object3D
    if (skinnedMesh) {
      const newParent = skinnedMesh.parent as Object3D
      newParent.scale.set(this.scale, this.scale, this.scale)
      newParent.updateMatrix()
      newParent.updateWorldMatrix(true, true)
      newParent.applyMatrix4(newParent.matrix)
      const bb = Walker.rootBoundingBox.setFromObject(skinnedMesh)
      Walker.rootBoundingBox = bb
      Walker.size = bb.max.y - bb.min.y
      Walker.rootCharacter = newParent
      sceneRoot.add(newParent)
    }
  }

  static updateWalkers(deltaTime: number, frustrum: Frustum): void {
    if (Walker.walkers.length === 0) return
    if (worldParameters.paused) return
    // Update each walker
    this.walkers.forEach((walker) => {
      if (!walker.isInFrustum(frustrum)) return
      walker.update(deltaTime)
      walker.handheldLantern.update()
    })
    Walker.animationManager.characterDataMap.forEach(
      (characterData, walker) => {
        if (!walker.isInFrustum(frustrum)) return
        characterData.mixer.update(deltaTime)
      }
    )
  }

  static setWalkerState(index: number, state: CharacterState) {
    if (this.walkers[index]) {
      this.walkers[index].currentState = state
    }
  }

  get otherWalkers() {
    return Walker.walkers
      .map((walker) => walker)
      .filter((walker) => walker !== this)
  }

  getBone(boneName: string): Bone | undefined {
    const bone = this.mesh.skeleton.getBoneByName(boneName)
    return bone
  }

  speechBubble: SpeechBubble | null = null

  update(deltaTime: number) {


    if (this.speechBubble) {
      this.speechBubble.followObject(this.object)
    }
    if (this.paused) return
    if (
      this.currentState == CharacterState.TALKING ||
      this.currentState == CharacterState.SITTING ||
      this.currentState == CharacterState.WAVING
    ) {
      this.updateState()
      return
    }


    const oldPosition = this.object.position.clone()
    // Calculate new position based on direction and speed
    const newPosition = this.object.position
      .clone()
      .add(this.direction.clone().multiplyScalar(this.speed * deltaTime))

    // Cast ray from above the new position to find the height at that point
    const rayStart = new Vector3(
      newPosition.x,
      this.world.innerBoundingBox!.max.y + 1,
      newPosition.z
    )
    const rayDirection = new Vector3(0, -1, 0)

    this.raycaster.set(rayStart, rayDirection)
    const groundIntersections = this.raycaster.intersectObject(
      this.world.baseMesh!
    )

    this.directionHelper.setDirection(this.direction)

    if (groundIntersections.length > 0) {
      // Found surface point, update y position
      newPosition.y = groundIntersections[0].point.y

      // Update cube position
      this.object.position.copy(newPosition)

      this.object.rotation.y = Math.atan2(this.direction.x, this.direction.z)

      if (Walker.focusedWalker?.id == this.id) {
        // Move controls to new position so we're always following the walker but  we allow the camera to move freely
        const camera = World.instance.camera

        const delta = newPosition.clone().sub(oldPosition)

        World.instance.controls.target = newPosition.add(
          new Vector3(0, Walker.size / 2, 0)
        )
        camera.position.add(delta)
      }

      // console.log('newPosition',newPosition)
      // Update bounding box
      this.boundingBox?.setFromObject(this.object)

      const collisions = []
      const collisionWithOtherWalker: Object3D[] = []
      const otherWalkers = this.otherWalkers.map(
        (walker) => walker.collisionMesh
      )
      this.collisionRayCasters.forEach((raycaster, index) => {
        raycaster.far = 0.25
        // set raycaster origin and direction, but set one raycaster go toward the front-left and the other go toward the front-right of the walker
        const offset = index == 0 ? 0.15 : -0.15 // Adjust the offset for left or right
        const rayStart = this.object.position
          .clone()
          .add(new Vector3(0, 0.1, 0))
        // console.log(this.direction.x,Math.sin(futureRotation.y),Math.cos(futureRotation.y))
        const rayDirection = new Vector3(
          this.direction.x + offset * Math.sin(this.direction.y),
          0,
          this.direction.z + offset * Math.cos(this.direction.y)
        ).normalize()
        raycaster.set(rayStart, rayDirection)

        /**
         * Debugging
         */
        if (index == 0) {
          this.collision1Helper.setDirection(rayDirection)
        } else {
          this.collision2Helper.setDirection(rayDirection)
        }

        const collisionIntersects = raycaster.intersectObjects(
          this.world.meshesExcludingIsland
        )
        if (collisionIntersects.length > 0) {
          collisions.push(collisionIntersects[0])
        }

        const collisionWithOtherWalkers =
          raycaster.intersectObjects(otherWalkers)
        if (collisionWithOtherWalkers.length > 0) {
          collisionWithOtherWalker.push(collisionWithOtherWalkers[0].object)
        }
      })

      if (collisionWithOtherWalker.length > 0) {
        if (isViewMode) return // in view mode, we dont want to trigger conversations
        if (!this.world.dayNightCycle.isDay) return // at night time, we dont want to trigger conversations
        if (Math.random() < 0.5) {
          let otherWalker: Walker = (collisionWithOtherWalker[0] as any).walker

          if (otherWalker.currentState == CharacterState.SITTING) {
            // ignore if sitting
            return
          }

          // For 5 seconds, don't re-play a conversation - to avoid spam
          if (
            this.lastConversationTime + 10000 < Date.now() &&
            otherWalker.lastConversationTime + 10000 < Date.now()
          ) {
            this.converseWithWalker(otherWalker)
          }
        }
      }

      if (collisions.length > 0) {
        this.changeWalkerDirection()
      }
    } else {
      // No surface found, change direction
      this.changeWalkerDirection()
    }

    // Check if walker is outside island bounds
    if (this.isOutsideBounds()) {
      this.changeWalkerDirection()
    }

    // Randomly change direction occasionally
    let num = gaussianRandom(0.5, 0.15)
    if (num < 0.005) {
      this.changeWalkerDirection()
    }

    // Take into account laziness modifier (which is a value between 0 and 1)
    if (this._sittingRNG < 0.1) {
      this._sittingRNG = 1 // avoid too many repetitions
      if (this.currentState == CharacterState.WALKING) {
        const duration = 5
        this.addStateToQueue(CharacterState.SITTING, {
          duration: duration,
          loop: false
        })
      }
    }

    this.updateState()
  }

  private converseWithWalker(otherWalker: Walker) {
    const showBubbles = () => {
      // Create speech bubble and add to scene
      const randomHello1 =
        conversationalHellos[
          Math.floor(Math.random() * conversationalHellos.length)
        ]
      const speechBubble1 = new SpeechBubble(randomHello1)
      this.scene.add(speechBubble1.getSprite())
      this.speechBubble = speechBubble1

      const randomHello2 =
        conversationalHellos[
          Math.floor(Math.random() * conversationalHellos.length)
        ]
      const speechBubble2 = new SpeechBubble(randomHello2)
      this.scene.add(speechBubble2.getSprite())
      otherWalker.speechBubble = speechBubble2
      speechBubble2.followObject(otherWalker.object)
      setTimeout(() => {
        if (this.speechBubble) {
          this.scene.remove(this.speechBubble.getSprite())
          this.speechBubble?.dispose()
          this.speechBubble = null
        }
        if (otherWalker.speechBubble) {
          this.scene.remove(otherWalker.speechBubble.getSprite())
          otherWalker.speechBubble?.dispose()
          otherWalker.speechBubble = null
        }
      }, 3000)
    }

    if (!this.hasState(CharacterState.TALKING)) {
      // Character isnt expected to be talking already, so play a conversation
      this.addStateToQueue(CharacterState.TALKING, {
        duration: 4,
        loop: false
      })
      showBubbles()
      if (otherWalker) {
        // Apply the same state to the other walker
        otherWalker.lastConversationTime = Date.now()
        otherWalker.addStateToQueue(CharacterState.TALKING, {
          duration: 4,
          loop: false
        })
        const faceWalker = this.object.position
          .clone()
          .sub(otherWalker.object.position)
          .normalize()
        faceWalker.y = 0
        otherWalker.changeWalkerDirection(faceWalker)
      }
    }
  }

  hasState(state: CharacterState) {
    return this.stateQueue.some((item) => item.state === state)
  }

  forceUpdateWearables() {
    if (this.hatWearables && Object.keys(this.hatWearables).length > 0) {
      for (const key in this.hatWearables) {
        this.hatWearables[key].update()
      }
    }
  }

  stateQueue: { state: CharacterState; duration?: number; loop?: boolean }[] =
    []
  addStateToQueue(
    state: CharacterState,
    options?: { duration?: number; loop?: boolean },
    force?: boolean
  ) {
    const duration = options?.duration || states[state].duration || 0
    const loop = options?.loop || states[state].loop || false

    if (force) {
      this.stateQueue.unshift({ state, duration, loop })
    } else {
      if(this.stateQueue.findIndex((item)=>item.state == state) > -1){
        console.log('State already in queue, skipping')
        // If the state already exists in the queue, do nothing
        return
      }
      this.stateQueue.push({ state, duration, loop })
    }
  }

  private isInFrustum(frustrum: Frustum): boolean {
    const intersects = frustrum.intersectsBox(this.boundingBox!)
    return intersects
  }

  currentStateDuration = 0
  private updateState() {
    if (this.currentStateDuration > 0) {
      return
    }
    if (this.stateQueue.length > 0) {
      const prevState = this.currentState

      if (this.stateQueue[0].state === prevState) {
        // If the next state in the queue is the same as the current state, remove it from the queue
        this.stateQueue.shift()
        return
      }

      const nextState = this.stateQueue.shift()
      if (!nextState) return

      this.currentState = nextState.state
      let blendSpeed = 0.9 * this.speed
      if (nextState.state == CharacterState.SITTING) {
        blendSpeed = 1.2
      }
      Walker.animationManager.setCharacterState(
        this,
        this.currentState,
        blendSpeed
      )
      if (nextState.state == CharacterState.TALKING) {
        this.lastConversationTime = Date.now()
      }
      if (nextState.duration) {
        this.currentStateDuration = nextState.duration || 0

        this.addStateToQueue(prevState, { duration: 0, loop: true }, true)
        setTimeout(() => {
          this.currentStateDuration = 0
        }, nextState.duration! * 1000)
      } else if (!nextState.loop) {
        const animationDuration = Walker.animationManager.getAnimationDuration(
          nextState.state
        )
        this.addStateToQueue(prevState, { duration: 0, loop: true }, true)
        setTimeout(() => {
          this.currentStateDuration = 0
        }, animationDuration! * 1000)
      }
    }
  }

  private isOutsideBounds(): boolean {
    if (!this.world.innerBoundingBox || !this.boundingBox) return true

    // Shrink island bounds a bit to keep walkers away from edges
    const margin = 1
    const shrunkBounds = this.world.innerBoundingBox.clone()
    shrunkBounds.min.add(new Vector3(margin, 0, margin))
    shrunkBounds.max.sub(new Vector3(margin, 0, margin))

    // Check if walker is outside shrunk bounds
    const walkerPosition = this.object.position.clone()
    return (
      walkerPosition.x < shrunkBounds.min.x ||
      walkerPosition.x > shrunkBounds.max.x ||
      walkerPosition.z < shrunkBounds.min.z ||
      walkerPosition.z > shrunkBounds.max.z
    )
  }

  private changeWalkerDirection(direction?: Vector3): void {
    // Calculate direction toward center of island
    if (!this.world.innerBoundingBox) return

    if (direction) {
      this.direction.copy(direction)
      return
    }

    const centerX =
      (this.world.innerBoundingBox.max.x + this.world.innerBoundingBox.min.x) /
      2
    const centerZ =
      (this.world.innerBoundingBox.max.z + this.world.innerBoundingBox.min.z) /
      2

    // Vector pointing to center with some randomness
    const toCenterDir = new Vector3(
      centerX - this.object.position.x + (Math.random() * 2 - 1) * 2,
      0,
      centerZ - this.object.position.z + (Math.random() * 2 - 1) * 2
    ).normalize()

    // Blend current direction with direction to center
    this.direction.lerp(toCenterDir, 0.5).normalize()
    // const arrowHelper = new ArrowHelper(this.direction, this.object.position, 1, 0x00ff00);
    // this.world.parent.add(arrowHelper);
  }

  remove() {
    if (this.hatWearables && Object.keys(this.hatWearables).length > 0) {
      for (const key in this.hatWearables) {
        Wearable.dispose(this.hatWearables[key])
        delete this.hatWearables[key]
      }
    }

    Walker.animationManager.removeCharacter(this)
    this.collisionMesh.removeFromParent()
    this.collisionMesh.geometry.dispose()
    this.collisionMesh.material = null!
    this.object.removeFromParent()
    this.scene.remove(this.object)
    this.boundingBox = null
    this.object = null!
    this.raycaster = null!
  }

  static removeWalker(index: number) {
    if (this.walkers[index]) {
      this.walkers[index].remove()
      this.walkers.splice(index, 1)
    }
  }

  static create(
    world: World,
    position?: Vector3,
    meta?: Partial<WalkerMetaInfo>,
    focus?: boolean
  ) {
    const walkerMeta: WalkerMetaInfo = {
      name: meta?.name || 'Skybud #000',
      color: meta?.color || Math.random() * 0xffffff,
      tokenId: meta?.tokenId ?? 0,
      talkative: meta?.talkative ?? true,
      laziness: meta?.laziness ?? 0.2,
      speed: meta?.speed ?? parseFloat((0.1 + Math.random() * 0.3).toFixed(2)),
      image_url: meta?.image_url || '',
      creator: meta?.creator || 'unknown',
      description: meta?.description || 'A Skybud'
    }

    const material = new MeshStandardMaterial({
      color: walkerMeta.color
    })

    const newParent = SkeletonUtils.clone(Walker.rootCharacter)
    newParent.name = 'walker_parent'
    newParent.frustumCulled = false
    const newMeshName = 'character_clone-' + Math.random()
    newParent.traverse((child) => {
      if ((child as SkinnedMesh).isSkinnedMesh) {
        child.name = newMeshName
        child.frustumCulled = false
        child.castShadow = true
        child.receiveShadow = false
      }
    })

    const mesh = newParent.getObjectByName(newMeshName) as SkinnedMesh

    mesh.material = material
    mesh.castShadow = true

    // Use provided position or generate random one
    const walkerPosition = position || world.getRandomPositionOnIsland()

    newParent.position.copy(walkerPosition)

    // Random direction
    const angle = Math.random() * Math.PI * 2 // Random angle between 0 and 2π
    const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle))

    let bb = new Box3().setFromObject(mesh)

    // Create walker
    const walker: walkerParams = {
      cube: newParent,
      mesh: mesh,
      direction,
      walkerMeta: walkerMeta,
      boundingBox: bb
    }
    const walkerInstance = new Walker(world, walker)
    this.walkers.push(walkerInstance)
    world.scene.add(newParent)
    return walkerInstance
  }
}
