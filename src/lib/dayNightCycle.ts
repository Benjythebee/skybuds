import { BackSide, BufferGeometry, Color, DirectionalLight, DirectionalLightHelper, HemisphereLight, ImageUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, RepeatWrapping, Scene, SphereGeometry, TextureLoader, Vector3} from 'three';
import { FireFlies } from './utils/fireflies';
/**
 * DayNightCycle class manages the lighting, sky color and time of day
 */
class DayNightCycle {
  private scene: Scene;
  private sun: DirectionalLight;
  private sun2: DirectionalLight;
  private moon: DirectionalLight;
  private ambientLight: HemisphereLight;
  private skyDome: Mesh<BufferGeometry, MeshBasicMaterial>;
  private nightSky: Mesh<BufferGeometry, MeshStandardMaterial>;
  private timeOfDay: number = 0.55; // Default to morning (values 0-1)
  private dayDuration: number = 100//300; // Duration of full cycle in seconds
  private autoRotate: boolean = true;
  private textureLoader:TextureLoader = new TextureLoader();
  
  private sunMesh: Mesh<BufferGeometry,MeshBasicMaterial> | null = null;
  private moonMesh: Mesh<BufferGeometry,MeshStandardMaterial> | null = null;
  private fireflies: FireFlies
  // Define colors for different times of day
  private readonly dayColor = new Color(0x87CEEB); // Sky blue
  private readonly nightColor = new Color(0x0a0a2a); // Dark blue
  private readonly sunsetColor = new Color(0xff7e50); // Orange sunset
  private readonly sunColor = new Color(0xffffff); // Sun light color
  private readonly moonColor = new Color(0x8888ff); // Moon light color
  private readonly moonMeshColor = new Color('#fcf0cf'); // Moon light color

  constantTime = false

  // Debug values
  sunHelper: DirectionalLightHelper 
  moonHelper: DirectionalLightHelper

  /**
   * Create a new day-night cycle
   * @param scene The js scene to add the cycle to
   */
  constructor(scene: Scene) {
    this.scene = scene;
    
    const initPosition = this.computeSunPosition(this.timeOfDay);
    // Create sun directional light
    this.sun = new DirectionalLight(this.sunColor, 1);
    this.sun.position.copy(initPosition)
    this.sun2 = new DirectionalLight(this.sunColor, 1);
    this.sun.add(this.sun2)
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 100;
    // this.sun.shadow.radius = 1.0
    // this.sun.shadow.bias = -0.5
    const d = 10;

    this.sun.shadow.camera.left = - d;
    this.sun.shadow.camera.right = d;
    this.sun.shadow.camera.top = d;
    this.sun.shadow.camera.bottom = - d;

    this.sun2.castShadow = true;
    this.sun2.shadow.mapSize.width = 1024;
    this.sun2.shadow.mapSize.height = 1024;
    this.sun2.shadow.camera.near = 0.5;
    this.sun2.shadow.camera.far = 100;

    this.sun2.shadow.camera.left = - d;
    this.sun2.shadow.camera.right = d;
    this.sun2.shadow.camera.top = d;
    this.sun2.shadow.camera.bottom = - d;

    const sunTarget = new Object3D();
    this.scene.add(sunTarget);
    sunTarget.position.copy(initPosition);
    this.sunHelper = new DirectionalLightHelper(this.sun, 5, 0x00ff00);
    this.sunHelper.visible = false; // Hide moon helper by default
    this.scene.add(this.sun,this.sunHelper,this.sun2);
    
    // Create moon directional light
    this.moon = new DirectionalLight(this.moonColor, 0.2);
    this.moon.position.set(0, -50, 0);
    this.moon.castShadow = true;
    this.moonHelper = new DirectionalLightHelper(this.moon, 5, 0x00ff00);
    this.moonHelper.visible = false; // Hide moon helper by default
    this.scene.add(this.moon,this.moonHelper);
    
    // Create ambient light for global illumination
    const hemisphereLight = new HemisphereLight(0xffffd9, 0x080820, 0.7);
    // scene.add(hemisphereLight);
    this.ambientLight =hemisphereLight as any// new AmbientLight(0x404040, 0.7);
    this.scene.add(this.ambientLight);
    
    // Create sky dome
    const skyGeo = new SphereGeometry(300, 32, 32);
    const skyMat = new MeshBasicMaterial({
      color: this.dayColor,
      side: BackSide
    });
    this.skyDome = new Mesh(skyGeo, skyMat);
    
    const nightSkyGeo = new SphereGeometry(55, 32, 32);
    const nightSkyMat = new MeshStandardMaterial({
      side: BackSide,
      map: this.textureLoader.load('/images/nightsky_color.png'),
      transparent: true,
      opacity:0,
      emissive: '#ffffff',
      emissiveIntensity:10,
      emissiveMap: this.textureLoader.load('/images/nightsky_emissive_.jpg')
    });
    nightSkyMat.map!.wrapS = nightSkyMat.map!.wrapT = RepeatWrapping;
    nightSkyMat.map!.repeat.set(3, 3);
    nightSkyMat.emissiveMap!.wrapS = nightSkyMat.emissiveMap!.wrapT = RepeatWrapping;
    nightSkyMat.emissiveMap!.repeat.set(3, 3);
    this.nightSky = new Mesh(nightSkyGeo, nightSkyMat);
    this.scene.add(this.skyDome);
    this.scene.add(this.nightSky);

    const geo = new SphereGeometry( 1.2, 16, 16 )
    this.sunMesh = new Mesh(geo,new MeshBasicMaterial({
      color		: 0xff0000
    }))
    this.scene.add(this.sunMesh)
    this.sunMesh.position.set(0, 49, 0)

    // Add moon mesh
    const moongeo = geo.clone().scale(0.5, 0.5, 0.5);
    const mat = new MeshStandardMaterial({
      map: this.textureLoader.load('/images/moon_1k.jpg'),
      emissiveMap: this.textureLoader.load('/images/moon_1k.jpg'),
      emissive: this.moonMeshColor,
      emissiveIntensity: 0.4,
    })
    this.moonMesh = new Mesh(moongeo, mat);
    this.moonMesh.position.set(0, -49, 0);
    this.scene.add(this.moonMesh);


    this.fireflies = new FireFlies(this.scene,{
      groupCount: 1,
      firefliesPerGroup: 20,
      groupRadius: new Vector3(2, 1, 2),
      noiseTexture: null
    })
    this.fireflies.fireflyMaterial.setColor(new Color('#ffffaa'))
    this.fireflies.fireflyMaterial.setOpacity(0.0)
    // Initialize with current time
    this.updateCycle(this.timeOfDay);
  }
  
  /**
   * Set the time of day/night cycle
   * @param time Value between 0 and 1 (0 = midnight, 0.5 = noon, 1 = midnight again)
   */
  public setTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(0, Math.min(1, time));
    this.updateCycle(this.timeOfDay);
  }
  
  // private starField	=async ()=>{
  //   // create the mesh
  //   const texture	=await this.textureLoader.loadAsync('images/galaxy_starfield.png')
  //   const material	= new MeshBasicMaterial({
  //     map	: texture,
  //     side	: BackSide,
  //      color	: 0x808080,
  //   })
  //   const geometry	= new SphereGeometry(100, 32, 32)
  //   const mesh	= new Mesh(geometry, material)
  //   this.object3d	= mesh
  
  //   this.update	= function(sunAngle){
  //     const phase	= THREEx.DayNight.currentPhase(sunAngle)
  //     if( phase === 'day' ){
  //       mesh.visible	= false
  //     }else if( phase === 'twilight' ){
  //       mesh.visible	= false
  //     } else {
  //       mesh.visible	= true
  //       mesh.material.opacity = 0
  //       mesh.rotation.y	= sunAngle / 5
  //             const intensity	= Math.abs(Math.sin(sunAngle))
  //             material.color.setRGB(intensity, intensity, intensity)
  //     }
  //   }
  // }

  /**
   * Get current time of day
   * @returns Value between 0 and 1
   */
  public getTimeOfDay(): number {
    return this.timeOfDay;
  }
  
  /**
   * Toggle automatic rotation
   * @param autoRotate Whether to automatically rotate day/night
   */
  public setAutoRotate(autoRotate: boolean): void {
    this.autoRotate = autoRotate;
  }
  
  /**
   * Set the duration of a full day-night cycle
   * @param seconds Duration in seconds
   */
  public setDayDuration(seconds: number): void {
    this.dayDuration = Math.max(1, seconds);
  }

  private computeSunAngleAndHeight(time: number) {
    // Calculate sun angle (0 = midnight, 0.5 = noon)
    const sunAngle = 2 * Math.PI * time - Math.PI / 2;
    const sunHeight = Math.sin(sunAngle);
    
    return { sunAngle, sunHeight };
  }

  public computeSunPosition(time: number,mirror?:boolean): Vector3 {
    // Calculate sun angle (0 = midnight, 0.5 = noon)
    const {sunAngle,sunHeight} = this.computeSunAngleAndHeight(time);
    
    // Position sun and moon (opposite to each other)
    return new Vector3((mirror?-1:1)*Math.cos(sunAngle), mirror?-sunHeight:sunHeight, 0).multiplyScalar(30);
  }

  setDay=()=>{
    this.timeOfDay = 0.25
  }

  setNight=()=>{
    this.timeOfDay = 0.75
  }

  get isDay(): boolean {
    return this.timeOfDay > 0.25 && this.timeOfDay < 0.75;
  }

  get isDayIncludingTwilightDawn(): boolean {
    return this.timeOfDay > 0.15 && this.timeOfDay < 0.9;
  }

  /**
   * Update the cycle based on the current time
   * @param time Value between 0 and 1
   */
  private updateCycle(time: number): void {
    // Calculate sun angle (0 = midnight, 0.5 = noon)
    const {sunAngle,sunHeight} = this.computeSunAngleAndHeight(time);
    
    // Position sun and moon (opposite to each other)
    const sunPosition = this.computeSunPosition(time);
    const moonPosition = this.computeSunPosition(time, true);
    this.sun.position.copy(sunPosition);
    this.moon.position.copy(moonPosition);
    this.sunMesh!.position.copy(sunPosition);
    this.moonMesh!.position.copy(moonPosition);
    // Calculate sun intensity based on height
    // The sun should be brightest at noon, and dimmer toward sunrise/sunset
    const sunIntensity = Math.max(0, sunHeight);
    this.sun.intensity = sunIntensity;
    this.sun2.intensity = Math.max(0.3, sunIntensity);
    
    // Moon is brightest at midnight, and becomes invisible during the day
    const moonIntensity = Math.max(0, -sunHeight * 0.2);

    this.moon.intensity = moonIntensity;
    this.moonMesh!.material.emissiveIntensity = moonIntensity+0.1
    this.moonMesh!.material.transparent = true;
    this.moonMesh!.material.opacity = sunHeight<0.1?1.0:Math.max(0,-sunHeight)

    // Calculate sky color based on time
    let skyColor: Color = (this.skyDome.material as MeshBasicMaterial).color.clone()

    if (sunHeight > 0.1) { 
      // Day
      skyColor = this.dayColor.clone();
    } else if (sunHeight > -0.1) {
      // Sunrise/sunset - blend between day, sunset and night
      // When we add 0.1 to sunHeight, we get a value between 0 and 0.2
      // By multiplying by 5, we scale this 0-0.2 range to a full 0-1 range
      let blendFactor = (sunHeight + 0.1) * 5; // 0 to 1
      if (time < 0.5) {
        // Sunrise - blend between night and sunset, then sunset and day
        if (blendFactor < 0.5) {
          skyColor = this.nightColor.clone().lerp(this.sunsetColor, blendFactor * 2);
        } else {
          skyColor = this.sunsetColor.clone().lerp(this.dayColor, (blendFactor - 0.5) * 2);
        }
      } else {
        // Sunset - invert the blend factor since sun is moving from +0.1 to -0.1
        // This makes blendFactor go from 0 to 1 as sunset progresses
        blendFactor = 1 - blendFactor;
        
        if (blendFactor < 0.5) {
          skyColor = this.dayColor.clone().lerp(this.sunsetColor, blendFactor * 2);
        } else {
          skyColor = this.sunsetColor.clone().lerp(this.nightColor, (blendFactor - 0.5) * 2);
        }
      }
    } else {
      // Night
      skyColor = this.nightColor.clone();
    }
    
    this.sun2.color = skyColor.clone().multiplyScalar(0.8);
    // Apply sky color
    (this.skyDome.material as MeshBasicMaterial).color = skyColor;
    this.nightSky.material.opacity = this.isDay?0:moonIntensity+0.1

    this.sunMesh!.material.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)+5) +")");
    // Adjust ambient light - brighter during day, dimmer at night
    this.ambientLight.intensity = 0.2 + sunHeight * 0.6;
    this.ambientLight.color = skyColor.clone().multiplyScalar(1.0)//this.isDayIncludingTwilightDawn?:new Color(0xffffd9);

    this.fireflies.fireflyMaterial.setOpacity(sunHeight>0.05?0:moonIntensity+0.1)

    this.moonHelper!.update();
    this.sunHelper!.update();
  }
  
  /**
   * Update the day-night cycle
   * @param deltaSeconds Seconds since last update
   */
  public update(deltaSeconds: number): void {
    if (this.autoRotate) {
      const timeIncrement = deltaSeconds / this.dayDuration;
      /***
       * If constantTime is true, we don't want to update the time of day
       */
      if(!this.constantTime){
        this.timeOfDay = (this.timeOfDay + timeIncrement) % 1;
      }
      this.updateCycle(this.timeOfDay);
    }

    this.fireflies.update(deltaSeconds);
  }
}

export default DayNightCycle;
