import { BufferGeometry, Color, Mesh, MeshStandardMaterial, SpotLight } from "three";
import { World } from "./World";
import { MeanRevertingValue } from  "./utils/MeanRevertingValue";

export class LightObject {
    light:SpotLight = null!
    constructor(public world:World,public mesh: Mesh<BufferGeometry,MeshStandardMaterial>){
        if(mesh.material.emissiveMap){
            mesh.material.emissive = new Color(1, 0.5, 0);
            this.light = new SpotLight(new Color(1, 0.5, 0), this.baseLightIntensity, 3, Math.PI / 4, 0.5, 2);
            this.light.position.copy(mesh.position)
            this.light.position.y += 1
            this.light.target = mesh
            this.light.castShadow = true;
            this.light.shadow.mapSize.width = 512;
            this.light.shadow.mapSize.height = 512;
            this.world.island.add(this.light)
            this.mesh.material.emissiveIntensity = this.baseEmissiveIntensity
        }
    }

    active:boolean = true
    isConstant:boolean = false
    isFlickering:boolean = true

    setLightColor(color:Color){
        this.light.color = color
    }

    setLight(spotLight:SpotLight){
        // Remove the old light from the scene
        if(this.light) {
            this.world.island.remove(this.light)
        }

        this.light = spotLight
        this.light.target = this.mesh
        this.light.castShadow = true;
        this.world.island.add(this.light)
    }

    get worldTime(){
        return this.world.dayNightCycle.getTimeOfDay()
    }


    baseLightIntensity = 0.9
    baseEmissiveIntensity = 0.9
    bonusFlicker = new MeanRevertingValue(0.5)

    /**
     * Compute the light intensity based on the world time
     * Light needs to be 1 at night and 0.1 at day
     * @param worldTime 
    * @returns The light intensity
     */
    computeLightIntensity(worldTime:number){
        // Compute the light intensity based on the world time
        // Light needs to be 1 at night and 0.1 at day
        let lightIntensity = 0.1 + (0.9 * Math.abs(Math.cos(worldTime * Math.PI)));
        return lightIntensity
        
    }

    update= ()=>{

        if(!this.isConstant){
        
            // If day time is greater than 0.2, slowly turn off the light
            if(this.worldTime > 0.2 && this.worldTime < 0.8 && this.active) {
                this.baseLightIntensity = this.computeLightIntensity(this.worldTime)

            } else if(this.worldTime < 0.2 && this.worldTime > 0.8 && !this.active) {
                this.baseLightIntensity = this.computeLightIntensity(this.worldTime)
            }
        }

        let flicker = 0
        if(this.active){
            // Add a flickering effect if the light is flickering
            if(this.baseLightIntensity>0.1 && this.isFlickering) {
                this.bonusFlicker.update()
                flicker = this.bonusFlicker.getValue()
            }
        }


        this.light.intensity = this.baseLightIntensity +flicker
        this.mesh.material.emissiveIntensity = this.baseLightIntensity + flicker
        if(Math.random() < 0.005) {
            this.bonusFlicker.randomize()
        }

    }

}