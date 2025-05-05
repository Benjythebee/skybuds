import { useViewContext } from "store/ViewContext";
import { Box3, Box3Helper, Color,  GridHelper, Group, LoadingManager, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Raycaster, Scene, SpotLight, Vector3} from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { gui } from "./config";
import DayNightCycle from "./dayNightCycle";
import { LightObject } from "./LightObject";
import { setupLightHouseBeam } from "./object/LightHouseBeam";


/***
 * =============================
 *  GLOBAL CONFIGURATIONS
 * =============================
 */
const folder2 = gui.addFolder( 'World' );
export const worldParameters = {
    paused:false,
    debug:false,
    worldTime:0.25,
    setTime:0.25,
    alwaysDay:false,
    islandHidden:false,
}
const onWorldToggleDebug = (value:boolean)=>{
  World.instance.toggleDebug()
  World.instance.dayNightCycle.moonHelper!.visible = value
  World.instance.dayNightCycle.sunHelper!.visible = value
}

folder2.add(worldParameters, 'paused').name('Paused')
folder2.add(worldParameters, 'debug').name('Debug').onChange(onWorldToggleDebug)
folder2.add(worldParameters, 'worldTime').name('worldTime').listen().disable()
folder2.add(worldParameters, 'setTime', 0, 1).name('Set Time').onChange((value:number)=>{
  World.instance.dayNightCycle.setTimeOfDay(value)
})
folder2.add(worldParameters, 'alwaysDay').name('Always Day').onChange((value:boolean)=>{
  if(value){
    World.instance.dayNightCycle.setTimeOfDay(0.505)
    World.instance.dayNightCycle.constantTime = true
  }else{
    World.instance.dayNightCycle.setTimeOfDay(worldParameters.worldTime)
    World.instance.dayNightCycle.constantTime = false
  }
})
folder2.add(worldParameters, 'islandHidden').name('Hide island').onChange((value:boolean)=>{
  if(World.instance.island){
    World.instance.baseMesh.visible = !value
  }
})
folder2.open()

export class World {
    static instance:World = null!
    GLTFLoader: GLTFLoader
    loadManager: LoadingManager = null!

    island:Group = null!
    baseMesh:Mesh = null!
    innerBoundingBox:Box3 = null!
    raycaster:Raycaster = new Raycaster()
    dayNightCycle:DayNightCycle
    isDebug = false

    meshesExcludingIsland:Mesh[] = []

    lightObjects:LightObject[] = []

    constructor(public parent:Object3D, public scene:Scene) {
        this.loadManager = new LoadingManager()
        this.GLTFLoader = new GLTFLoader(this.loadManager)
        this.loadManager.onStart = () => {
            useViewContext.getState().setLoading(true)
            console.log('Loading started');
        };
        // this.loadManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        //     console.log(`Loading ${url}: ${itemsLoaded} of ${itemsTotal} files loaded`);
        // };
        this.loadManager.onLoad = () => {
            console.log('World Loading complete');
            useViewContext.getState().setLoading(false)
        };
        this.loadManager.onError = (url) => {
            console.error(`Error loading ${url}`);
        };

        this.dayNightCycle = new DayNightCycle(this.scene)
        this.renderGrid()
        World.instance =this
    }

    debugGrid:GridHelper = null!
    renderGrid = () => {
        this.debugGrid = new GridHelper(100, 100, 0x0000ff, 0x808080)
        // gridHelper.rotation.x = Math.PI / 2
        this.debugGrid.visible = this.isDebug
        
        this.scene.add(this.debugGrid)
    }

    innerBoundingBoxHelper:Box3Helper = null!
    toggleDebug(){
      if(this.innerBoundingBoxHelper){
        this.innerBoundingBoxHelper.visible = this.isDebug
      }
      if(this.debugGrid){
        this.debugGrid.visible = this.isDebug
      }
      if(this.lightHouseBeam){
        this.lightHouseBeam.spotlightHelper.visible = this.isDebug
      }
    }


    lightHouseBeam:ReturnType<typeof setupLightHouseBeam> & {
      target:Group
    } = null!
    private setupLights = () => {
      this.island.traverse((child) => {
        if ((child as Mesh).isMesh || (child as any).isSkinnedMesh) {

          if(((child as any).material as MeshStandardMaterial).emissiveMap){
            // Fire-like color
            const newLightObject = new LightObject(this, child as any)
            this.lightObjects.push(newLightObject)
            if(child.name.includes('M_Fire_Wood')){
              newLightObject.setLightColor(new Color('#ff0000'))
              newLightObject.isFlickering = true
              newLightObject.isConstant = true
            }
            if(child.name.includes('M_Light_House')){
              //@TODO: add light house light

              const {light,parent,mesh,spotlightHelper} = setupLightHouseBeam()
              this.island.add(parent)
              const target = new Group()
              this.island.add(target)
              target.position.copy(child.position)//.add(new Vector3(0, 1, 0))
              parent.position.copy(child.position).add(new Vector3(0, 2.25, 0))
              this.lightHouseBeam = {light,parent,mesh,spotlightHelper,target:target}

              spotlightHelper.update()

              mesh.material.uniforms.lightColor.value.set(new Color('#ffffaa'))
              mesh.material.uniforms.spotPosition.value	= mesh.position.clone()


            }

            if(child.name.includes('lantern')){
              newLightObject.light.angle = Math.PI / 1.2
              newLightObject.light.penumbra = 0.5
              newLightObject.light.position.add(new Vector3(0, -0.65, 0))
            }


          }
        }
      });
    }

    public load =async ()=>{
        
       const asset = await this.GLTFLoader.loadAsync('/assets/island.glb')

       asset.scene.position.set(0, -4, 0)
       this.island = asset.scene

        // Find the actual mesh in the loaded model
        this.island.traverse((child) => {
            if ((child as Mesh).isMesh || (child as any).isSkinnedMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // We'll use the first mesh we find as our island surface
              if (child.name ==='M_Floating_Base_') {
                this.baseMesh = child as Mesh;
                child.castShadow = false;
              }else{
                this.meshesExcludingIsland.push(child as Mesh)
              }
            }
          });

        this.setupLights()
    // Calculate island bounding box
        const source = new Box3().setFromObject(this.baseMesh);
        const min = source.min.clone().setZ(-6).setX(-8).setY(-1)
        const max = source.max.clone().setZ(8).setX(8)
        this.innerBoundingBox = new Box3().setFromPoints([min, max]);
        this.innerBoundingBox.max.add(new Vector3(0, -4, 0))
          /**
           * Add debug helper for the bounding box
           */
        this.innerBoundingBoxHelper = new Box3Helper(this.innerBoundingBox, 0xffff00);
        this.innerBoundingBoxHelper.visible = this.isDebug
        this.parent.add(this.innerBoundingBoxHelper);
        this.innerBoundingBoxHelper.updateMatrix()
        // this.baseMesh.visible = false
       this.parent.add(this.island)
    }


    getRandomPositionOnIsland(): Vector3 {
        if (!this.innerBoundingBox || !this.baseMesh) {
          return new Vector3(0, 0, 0);
        }
        
        // Get island dimensions
        const min = this.innerBoundingBox.min;
        const max = this.innerBoundingBox.max;
        
        // Generate random x and z within island bounds (shrink a bit to keep away from edges)
        const margin = 0.1;
        const x = Math.random() * (max.x - min.x - margin * 2) + min.x + margin;
        const z = Math.random() * (max.z - min.z - margin * 2) + min.z + margin;
        
        // Use raycasting to find height at this point
        const rayStart = new Vector3(x, max.y +1, z); // Start above the island
        const rayDirection = new Vector3(0, -1, 0); // Cast downward
        this.raycaster.far=2
        this.raycaster.set(rayStart, rayDirection);
        const intersects = this.raycaster.intersectObject(this.baseMesh);
        if (intersects.length > 0) {
          // Place slightly above the intersection point to avoid z-fighting
          const y = intersects[0].point.y + 0.01; 
          return new Vector3(x, y, z);
        }
        
        // Fallback if no intersection
        return new Vector3(x, max.y, z);
      }

    public update =(delta:number)=>{
      if(worldParameters.paused) return
      if(this.dayNightCycle){
        this.dayNightCycle.update(delta)
        worldParameters.worldTime = parseFloat(this.dayNightCycle.getTimeOfDay().toFixed(4))
      }

      this.lightObjects.forEach(lightObject=>{
        lightObject.update()
      })

      if(this.lightHouseBeam){
        const timeOfDay = this.dayNightCycle.getTimeOfDay()
        let intensity = 1-Math.sin(timeOfDay * Math.PI)
        this.lightHouseBeam.light.intensity = intensity * 5
        this.lightHouseBeam.mesh.material.uniforms.intensityModifier.value = intensity
        
        const radius = 5
        const speed = 0.2 // radians per second
        const center = this.lightHouseBeam.parent.position.clone().add(this.island.position)
        const target = this.lightHouseBeam.target
        // Get the current position relative to center
        const relativePos = target.position.clone().sub(center);
        
        // Calculate current angle in radians
        const currentAngle = Math.atan2(relativePos.z, relativePos.x);
        
        // Calculate new angle based on speed and delta time
        const newAngle = currentAngle + speed * delta;
        
        // Update position to follow circular path
        target.position.x = center.x + radius * Math.cos(newAngle);
        target.position.z = center.z + radius * Math.sin(newAngle);
        target.position.y = center.y //+ 1.5
        this.lightHouseBeam.light.target.position.copy(target.position)
        // this.lightHouseBeam.light.lookAt(target.position)
        this.lightHouseBeam.mesh.lookAt(target.position)
        this.lightHouseBeam.spotlightHelper.update()
      }
    }
    
}

