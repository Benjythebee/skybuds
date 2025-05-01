import { ArrowHelper, Box3, BoxGeometry, Group, LoadingManager, Mesh, MeshStandardMaterial, SkinnedMesh, Raycaster, Scene, Object3D, Vector3, Box3Helper } from "three";
import { World, worldParameters} from "./World";
import { FontLoader, GLTFLoader, SkeletonUtils } from "three/examples/jsm/Addons.js";
import { useAudioContext } from "store/AudioContext";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { gui } from "./config";


/***
 * =============================
 *  WALKERS CONFIGURATIONS
 * =============================
 */
const folder1 = gui.addFolder( 'Walkers' );
export const walkerConfigurations = {
    debug:false,
}

const onToggleDebug = (value:boolean)=>{
    Walker.toggleDebug()
}

folder1.add(walkerConfigurations, 'debug').name('Debug').onChange(onToggleDebug)
folder1.open()


type walker = {
    cube: Object3D;
    mesh: SkinnedMesh;
    direction: Vector3;
    speed: number;
    boundingBox: Box3 | null;
  };

// const loader = new FontLoader();
// let font = null!
// loader.load( 'fonts/helvetiker_regular.typeface.json',(font)=>{
//     font = font
//     console.log('font',font)
// })

export class Walker {
    static size = 0.5; //overwritten
    static rootBoundingBox = new Box3()
    static scale = 0.3

    object: Object3D;
    mesh: SkinnedMesh;
    direction: Vector3;
    speed: number;
    boundingBox: Box3 | null;
    static walkers: Walker[] = [];
    raycaster: Raycaster = new Raycaster()
    static rootCharacter: Object3D = null!
    static loaderManager: LoadingManager = new LoadingManager()
    static gltfLoader: GLTFLoader = new GLTFLoader(this.loaderManager)

    collisionRayCasters = [new Raycaster(),new Raycaster()]
    collisionMesh: Mesh 

    state: 'idle' | 'walking' = 'idle'

    static collisionMaterial = new MeshStandardMaterial({ color: 0xff0000,visible:false, transparent: true, opacity: 0.5 });

    debugRayCaster:Raycaster = new Raycaster()

    constructor(public world:World,props:walker){
        this.object = props.cube
        this.mesh = props.mesh
        this.direction = props.direction
        this.speed = props.speed
        this.boundingBox = props.boundingBox

        this.raycaster.far=2
        this.directionHelper.visible = false
        this.collision1Helper.visible = false
        this.collision2Helper.visible = false
        // this.directionHelper.rotateOnAxis(new Vector3(0,1,0),Math.PI)
        this.object.add(this.directionHelper)
        this.object.add(this.collision1Helper)
        this.object.add(this.collision2Helper)
        // generate box geometry for collision detection; use boundingbox
        const geomData = {
            width: this.boundingBox!.max.x-this.boundingBox!.min.x,
            height: this.boundingBox!.max.y-this.boundingBox!.min.y,
            depth: this.boundingBox!.max.z-this.boundingBox!.min.z
        }
        geomData.width = geomData.width * 1/Walker.scale *10
        geomData.height = geomData.height * 1/Walker.scale *10
        geomData.depth = geomData.depth * 1/Walker.scale *10
        const geometry = new BoxGeometry(geomData.width, geomData.height, geomData.depth);
        const collisionMaterial = Walker.collisionMaterial

        this.collisionMesh = new Mesh(geometry, collisionMaterial);
        this.collisionMesh.frustumCulled = false

        this.collisionMesh.position.set(0,1,0)

        // this.collisionMesh.rotation.copy(this.mesh.rotation)
        this.object.add(this.collisionMesh)
        this.collisionMesh.updateMatrixWorld(true)
        this.collisionMesh.updateMatrix()

    }

    static isDebug = false
    directionHelper:ArrowHelper = new ArrowHelper( this.raycaster.ray.direction, new Vector3(0,1,0), 5, 0xff0000 )
    collision1Helper:ArrowHelper = new ArrowHelper( new Vector3(0,1,0), new Vector3(0,1,0), 2.5, 0xffff00 )
    collision2Helper:ArrowHelper = new ArrowHelper( new Vector3(0,1,0), new Vector3(0,1,0), 2.5, 0x00ff00 )
    static toggleDebug(){
      this.isDebug = walkerConfigurations.debug
      Walker.collisionMaterial.visible = walkerConfigurations.debug
      Walker.walkers.forEach(walker => {
        walker.directionHelper!.visible = walkerConfigurations.debug
      })
    }

    get scene() {
        return this.world.scene as Scene
    }

    static async loadRoot(sceneRoot:Scene){
        const assets = await Walker.gltfLoader.loadAsync('/assets/Character.glb')

        const newObjects = SkeletonUtils.clone(assets.scene)
        newObjects.frustumCulled = false
        // newObjects.position.set(0, -2, 0)

        newObjects.traverse((child) => {
          if((child as SkinnedMesh).isSkinnedMesh){

            child.name='character'
            }
        })


        const skinnedMesh = newObjects.getObjectByName('character') as Object3D
        if (skinnedMesh) {
          const newParent = skinnedMesh.parent as Object3D
          newParent.scale.set(this.scale, this.scale, this.scale)
          newParent.updateMatrix()
          newParent.updateWorldMatrix(true, true)
          newParent.applyMatrix4(newParent.matrix)
          const bb = Walker.rootBoundingBox.setFromObject(skinnedMesh)
          Walker.rootBoundingBox = bb
          Walker.size =(bb.max.y- bb.min.y)
          Walker.rootCharacter = newParent
          sceneRoot.add(newParent)
        }

        
    }

    static updateWalkers(deltaTime: number): void {
        if (Walker.walkers.length === 0) return;
        if(worldParameters.paused) return
        // Update each walker
        this.walkers.forEach(walker => {
            walker.update(deltaTime);
        });
      }

    static setWalkerState(index:number,state:'idle'|'walking'){
        if(this.walkers[index]){
            this.walkers[index].state = state
        }
    }

    get otherWalkers(){
        return Walker.walkers.map(walker => walker).filter(walker => walker !== this)
    }

    speechBubbleMesh:Mesh|null = null
    speechBubble = ()=>{


    }

    update(deltaTime: number) {
        // Calculate new position based on direction and speed
        const newPosition = this.object.position.clone().add(
            this.direction.clone().multiplyScalar(this.speed * deltaTime)
          );

          // Cast ray from above the new position to find the height at that point
          const rayStart = new Vector3(
            newPosition.x, 
            this.world.innerBoundingBox!.max.y +1, 
            newPosition.z
          );
          const rayDirection = new Vector3(0, -1, 0);
          
          this.raycaster.set(rayStart, rayDirection);
          const groundIntersections = this.raycaster.intersectObject(this.world.baseMesh!);

          this.directionHelper.setDirection(this.direction)

          if (groundIntersections.length > 0) {
            // Found surface point, update y position
            newPosition.y = groundIntersections[0].point.y;
            
            // Update cube position
            this.object.position.copy(newPosition);

            this.object.rotation.y = Math.atan2(this.direction.x, this.direction.z)

            // console.log('newPosition',newPosition)
            // Update bounding box
            this.boundingBox?.setFromObject(this.object);


            const collisions =[]
            const collisionWithOtherWalker=[]
            const otherWalkers = this.otherWalkers.map(walker => walker.collisionMesh)
            this.collisionRayCasters.forEach((raycaster, index) => {
              raycaster.far = 0.25
              // set raycaster origin and direction, but set one raycaster go toward the front-left and the other go toward the front-right of the walker
              const offset =index==0?0.15: -0.15; // Adjust the offset for left or right
              const rayStart = this.object.position.clone().add(new Vector3(0, 0.1, 0));
              // console.log(this.direction.x,Math.sin(futureRotation.y),Math.cos(futureRotation.y))
              const rayDirection = new Vector3(
                this.direction.x + offset * Math.sin(this.direction.y),
                0,
                this.direction.z + offset * Math.cos(this.direction.y)
              ).normalize();
              raycaster.set(rayStart, rayDirection);
  
              /**
               * Debugging
               */
              if(index==0){
                this.collision1Helper.setDirection(rayDirection)
              }else{
                this.collision2Helper.setDirection(rayDirection)
              }

              const collisionIntersects = raycaster.intersectObjects(this.world.meshesExcludingIsland)
              if(collisionIntersects.length > 0) {
                collisions.push(collisionIntersects[0])
              }
              

              const collisionWithOtherWalkers = raycaster.intersectObjects(otherWalkers)
              if(collisionWithOtherWalkers.length > 0) {
                collisionWithOtherWalker.push(collisionWithOtherWalkers[0])
              }

            })

            if(collisionWithOtherWalker.length>0 ){
              if(Math.random() < 0.1){
                useAudioContext.getState().playRandomConversation()
              }
            }

            if(collisions.length>0){
              this.changeWalkerDirection();
            }
          } else {
            // No surface found, change direction
            this.changeWalkerDirection();
          }
          
          // Check if walker is outside island bounds
          if (this.isOutsideBounds()) {
            this.changeWalkerDirection();
          }
          
          // Randomly change direction occasionally
          if (Math.random() < 0.005) {
            this.changeWalkerDirection();
          }
    }

    private isOutsideBounds(): boolean {
        if (!this.world.innerBoundingBox || !this.boundingBox) return true;
        
        // Shrink island bounds a bit to keep walkers away from edges
        const margin = 1;
        const shrunkBounds = this.world.innerBoundingBox.clone();
        shrunkBounds.min.add(new Vector3(margin, 0, margin));
        shrunkBounds.max.sub(new Vector3(margin, 0, margin));
        
        // Check if walker is outside shrunk bounds
        const walkerPosition = this.object.position.clone();
        return (
          walkerPosition.x < shrunkBounds.min.x || 
          walkerPosition.x > shrunkBounds.max.x ||
          walkerPosition.z < shrunkBounds.min.z || 
          walkerPosition.z > shrunkBounds.max.z
        );
      }

    private changeWalkerDirection(): void {
      // Calculate direction toward center of island
      if (!this.world.innerBoundingBox) return;
      
      const centerX = (this.world.innerBoundingBox.max.x + this.world.innerBoundingBox.min.x) / 2;
      const centerZ = (this.world.innerBoundingBox.max.z + this.world.innerBoundingBox.min.z) / 2;
      
      // Vector pointing to center with some randomness
      const toCenterDir = new Vector3(
          centerX - this.object.position.x + (Math.random() * 2 - 1) * 2,
          0,
          centerZ - this.object.position.z + (Math.random() * 2 - 1) * 2
      ).normalize();
      
      // Blend current direction with direction to center
      this.direction.lerp(toCenterDir, 0.5).normalize();
      // const arrowHelper = new ArrowHelper(this.direction, this.object.position, 1, 0x00ff00);
      // this.world.parent.add(arrowHelper);
    }

    remove(){
        this.collisionMesh.removeFromParent()
        this.collisionMesh.geometry.dispose()
        this.collisionMesh.material=null!
        this.world.island.remove(this.object)
        this.boundingBox = null
        this.object = null!
        this.raycaster =null!
    }

    static removeWalker(index:number){
        if(this.walkers[index]){
            this.walkers[index].remove()
            this.walkers.splice(index,1)
        }
    }

    static create(world:World,position?:Vector3) {

        const material = new MeshStandardMaterial({
          color: Math.random() * 0xffffff,
        });
        
        const newParent = SkeletonUtils.clone(Walker.rootCharacter)
        newParent.name = 'walker_parent'
        newParent.frustumCulled = false
        const newMeshName = 'character_clone-'+Math.random()
        newParent.traverse((child) => {
            if((child as SkinnedMesh).isSkinnedMesh){
                child.name=newMeshName
                child.frustumCulled = false
                child.castShadow = true;
                child.receiveShadow = true;
            }
        })

        const mesh = newParent.getObjectByName(newMeshName) as SkinnedMesh
        mesh.material=material
        mesh.castShadow = true;

            // Use provided position or generate random one
        const walkerPosition = position || world.getRandomPositionOnIsland();

        newParent.position.copy(walkerPosition);

        // Random direction
        const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
        const direction = new Vector3(
            Math.cos(angle),
            0,
            Math.sin(angle)
        );
        
        let bb = new Box3().setFromObject(mesh)

        // Create walker
        const walker: walker = {
            cube: newParent,
            mesh: mesh,
            direction,
            speed: 0.1 + Math.random() * 0.5,
            boundingBox: bb,
        };

        this.walkers.push(new Walker(world,walker));
        world.parent.add(newParent);
    }
}

class SpeechBubbleGenerator{

  constructor(public world:World,public walker:Walker){
    this.world = world
    this.walker = walker
  
  }


}

