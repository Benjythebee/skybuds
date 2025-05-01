import {AmbientLight, BackSide, Color, DirectionalLight, ImageUtils, Mesh, MeshBasicMaterial, Scene, SphereGeometry, TextureLoader} from 'three';

/**
 * DayNightCycle class manages the lighting, sky color and time of day
 */
class DayNightCycle {
  private scene: Scene;
  private sun2: DirectionalLight;
  private sun: DirectionalLight;
  private moon: DirectionalLight;
  private ambientLight: AmbientLight;
  private skyDome: Mesh;
  private timeOfDay: number = 0.4; // Default to morning (values 0-1)
  private dayDuration: number = 300; // Duration of full cycle in seconds
  private autoRotate: boolean = true;
  private textureLoader:TextureLoader = new TextureLoader();
  
  // Define colors for different times of day
  private readonly dayColor = new Color(0x87CEEB); // Sky blue
  private readonly nightColor = new Color(0x0a0a2a); // Dark blue
  private readonly sunsetColor = new Color(0xff7e50); // Orange sunset
  private readonly sunColor = new Color(0xffffff); // Sun light color
  private readonly sun2Color = new Color(0xffffaa); // Sun light color
  private readonly moonColor = new Color(0x8888ff); // Moon light color

  /**
   * Create a new day-night cycle
   * @param scene The js scene to add the cycle to
   */
  constructor(scene: Scene) {
    this.scene = scene;
    
    // Create sun directional light
    this.sun = new DirectionalLight(this.sunColor, 1);
    this.sun.position.set(0, 50, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 50;
    this.scene.add(this.sun);

    // Create sun2 directional light
    this.sun2 = new DirectionalLight(this.sunColor, 0.6);
    this.sun2.position.set(0, 50, 0);
    this.sun2.castShadow = true;
    this.sun2.shadow.mapSize.width = 2048;
    this.sun2.shadow.mapSize.height = 2048;
    this.sun2.shadow.camera.near = 0.5;
    this.sun2.shadow.camera.far = 50;
    this.scene.add(this.sun2);
    
    // Create moon directional light
    this.moon = new DirectionalLight(this.moonColor, 0.2);
    this.moon.position.set(0, -50, 0);
    this.moon.castShadow = true;
    this.scene.add(this.moon);
    
    // Create ambient light for global illumination
    this.ambientLight = new AmbientLight(0x404040, 0.2);
    this.scene.add(this.ambientLight);
    
    // Create sky dome
    const skyGeo = new SphereGeometry(300, 32, 32);
    const skyMat = new MeshBasicMaterial({
      color: this.dayColor,
      side: BackSide
    });
    this.skyDome = new Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
    
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

  /**
   * Update the cycle based on the current time
   * @param time Value between 0 and 1
   */
  private updateCycle(time: number): void {
    // Calculate sun angle (0 = midnight, 0.5 = noon)
    const sunAngle = 2 * Math.PI * time - Math.PI / 2;
    const sunHeight = Math.sin(sunAngle);
    
    // Position sun and moon (opposite to each other)
    this.sun.position.set(Math.cos(sunAngle), sunHeight, 0);
    this.sun2.position.set(Math.cos(sunAngle), sunHeight, 0);
    this.moon.position.set(-Math.cos(sunAngle), -sunHeight, 0);
    
    // Calculate sun intensity based on height
    // The sun should be brightest at noon, and dimmer toward sunrise/sunset
    const sunIntensity = Math.max(0, sunHeight);
    this.sun.intensity = sunIntensity;
    this.sun2.intensity = sunIntensity*0.5;
    
    // Moon is brightest at midnight, and becomes invisible during the day
    const moonIntensity = Math.max(0, -sunHeight * 0.2);
    this.moon.intensity = moonIntensity;
    
    // Calculate sky color based on time
    let skyColor: Color;
    
    if (sunHeight > 0.1) { 
      // Day
      skyColor = this.dayColor.clone();
    } else if (sunHeight > -0.1) {
      // Sunrise/sunset - blend between day, sunset and night
      const blendFactor = (sunHeight + 0.1) * 5; // 0 to 1
      if (time < 0.5) {
        // Sunrise - blend between night and sunset, then sunset and day
        if (blendFactor < 0.5) {
          skyColor = this.nightColor.clone().lerp(this.sunsetColor, blendFactor * 2);
        } else {
          skyColor = this.sunsetColor.clone().lerp(this.dayColor, (blendFactor - 0.5) * 2);
        }
      } else {
        // Sunset - blend between day and sunset, then sunset and night
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
    
    // Apply sky color
    (this.skyDome.material as MeshBasicMaterial).color = skyColor;
    
    // Adjust ambient light - brighter during day, dimmer at night
    this.ambientLight.intensity = 0.2 + sunHeight * 0.1;
  }
  
  /**
   * Update the day-night cycle
   * @param deltaSeconds Seconds since last update
   */
  public update(deltaSeconds: number): void {
    if (this.autoRotate) {
      const timeIncrement = deltaSeconds / this.dayDuration;
      this.timeOfDay = (this.timeOfDay + timeIncrement) % 1;
      this.updateCycle(this.timeOfDay);
    }
  }
}

export default DayNightCycle;