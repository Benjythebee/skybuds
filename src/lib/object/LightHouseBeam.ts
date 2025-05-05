import { volumetricSpotLightMaterial } from "../utils/volumetricSpotlightMaterial.js"
import { CylinderGeometry, Group, Matrix4, Mesh, ShaderMaterial, SpotLight, SpotLightHelper } from "three"


export const setupLightHouseBeam = () => {
    
    const height = 10
    const newSpotLight = new SpotLight(0xFFFFaa, 10, height,Math.PI/3, 0.5, 2)
    const helper = new SpotLightHelper(newSpotLight, 0xFFFFaa)
    const geometry = new CylinderGeometry( 0.1, 2.5, height, 32*2, 20, true)
    geometry.applyMatrix4( new Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) )
    geometry.applyMatrix4( new Matrix4().makeRotationX( -Math.PI / 2 ) )
    const material = volumetricSpotLightMaterial() as unknown as ShaderMaterial
    const mesh = new Mesh(geometry, material)
    const parent = new Group()
    // newSpotLight.rotateX(Math.PI / 2)
    newSpotLight.position.copy(mesh.position)
    parent.add(mesh)
    parent.add(newSpotLight,helper)
    helper.visible = false
    return {
        parent: parent,
        mesh: mesh as Mesh<CylinderGeometry, ShaderMaterial>,
        light: newSpotLight,
        spotlightHelper: helper
    }
}