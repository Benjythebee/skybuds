import { Bone, BufferGeometry, Color, DynamicDrawUsage, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, PointLight, Quaternion, Scene, SpotLight, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Walker } from "../Walker";
import { applyTransforms } from "../utils/utils";


const lanternSettings = {
            category: 'Accessories',
            bone: 'handR',
            name: 'Lantern',
            url: '/assets/lantern.glb',
            imageUrl: '',
            scale: 1,
            positionNudge: { x: 0, y: -0.1, z: 0 },
            rotationNudge: { x: 0, y: 0, z: Math.PI },
            index:0
        }


export class HandheldLantern {
    static GLTFLoader = new GLTFLoader()
    static root:InstancedMesh<BufferGeometry,MeshStandardMaterial> // Cache the loaded objects
    instanceIndex = 0
    position:Vector3 = new Vector3(0, 0, 0)
    rotation:Vector3 = new Vector3(0, 0, 0)

    wearableData:typeof lanternSettings
    constructor(public scene:Scene,public walker:Walker){


        this.wearableData = lanternSettings 

        if(!HandheldLantern.root){
            // Load a root object and then generate instance of it
            HandheldLantern.GLTFLoader.loadAsync(this.wearableData.url).then((gltf) => {
                const group = gltf.scene
                let mesh:Mesh=null!
                    group.traverse((child) => {
                    if ((child as Mesh).isMesh) {
                        mesh = child as Mesh
                    }
                })
                if(!mesh){
                    throw new Error(`Lantern has no mesh`)
                }
                mesh.removeFromParent()
                mesh.scale.set(this.wearableData.scale, this.wearableData.scale, this.wearableData.scale)
                mesh.position.add(this.positionNudge)
                mesh.rotation.x += this.rotationNudge.x
                mesh.rotation.y += this.rotationNudge.y
                mesh.rotation.z += this.rotationNudge.z
                applyTransforms(mesh)

                const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, 1000)
                instancedMesh.frustumCulled = false
                instancedMesh.instanceMatrix.setUsage( DynamicDrawUsage )
                instancedMesh.frustumCulled = false
                HandheldLantern.root = instancedMesh as any
                instancedMesh.visible = false
                this.scene.add(instancedMesh)
                // set local:
                this.instanceIndex = 0
                instancedMesh.count = 1
                
                HandheldLantern.updateInstanceMap(this.instanceIndex, this)
                this.root.instanceMatrix.needsUpdate = true
                this.updateRotPosition()
                
            })
        }else{
            this.createInstance()
        }
        this.targetBone?.add(this._tmpObject)
    }

    get root(){
        return HandheldLantern.root
    }

    get targetBone(){
        const boneName = this.wearableData.bone
        const bone = this.walker.getBone(boneName)
        if(!bone){
            throw new Error(`HandheldLantern: has no bone ${boneName}`)
        }
        return bone
    }

    static isVisible(){
        return this.root.visible
    }

    static setVisible(val:boolean){
        if(this.root){
            this.root.visible = val
        }
    }

    static turnOn(){
        if(this.root){
            this.root.material.emissiveIntensity = 3
            this.root.material.emissive = new Color(1, 0.5, 0)
        }
    }

    static turnOff(){
        if(this.root){
            this.root.material.emissiveIntensity = 0
        }
    }

    get positionNudge(){
        const nudge = this.wearableData.positionNudge
        return new Vector3(nudge.x, nudge.y, nudge.z)
    }
    
    get rotationNudge(){
        const nudge = 'rotationNudge' in this.wearableData && this.wearableData.rotationNudge
        return nudge?new Vector3(nudge.x, nudge.y, nudge.z) : new Vector3(0, 0, 0)
    }
    static updateInstanceMap(instanceNumber:number, instance:HandheldLantern){
        if(!HandheldLantern.root.userData){
            HandheldLantern.root.userData = {}
        }
        HandheldLantern.root.userData[instanceNumber] = instance
    }
    
    static dispose (waerableHat:HandheldLantern){
        const root = HandheldLantern.root

        /**
         * When a hat is removed, the count will be going down
         * This means the instance index of the rest of the hats NEEDS to be updated
         */

        const indexToReplace = waerableHat.instanceIndex // get current index, for example 4
        const instanceAtLastIndex = root.userData[root.count - 1] as HandheldLantern // get the last index, for example 5

        // Remove the instance from the instance map
        if (root.userData[indexToReplace]) {
            if(waerableHat._tmpObject){
                waerableHat.targetBone?.remove(waerableHat._tmpObject)
            }
            delete root.userData[indexToReplace]
        }


        // If the last instance is the same as the one we are removing, we can just remove it
        // for example if we are removing index 4 and the last index is also 4
        if(instanceAtLastIndex.instanceIndex == indexToReplace){
            // do nothing
            console.log('removing last instance')
            root.count--
            return
        }

        // move the last instance to the current index
        // for example if we are removing index 4 and the last index is 5, content at 5 will be moved to 4
        root.userData[indexToReplace] = instanceAtLastIndex
        instanceAtLastIndex.instanceIndex = indexToReplace
        // remove the content at the last index since we moved it to the current index
        delete root.userData[root.count]
        root.count--

        instanceAtLastIndex.updateRotPosition()
    }
    
    private createInstance(){
        const root = HandheldLantern.root
        if(!root){
            throw new Error(`HandheldLantern: is not loaded yet`)
        }

        this.instanceIndex = root.count
        root.count++
        HandheldLantern.updateInstanceMap( this.instanceIndex, this)
        this.root.instanceMatrix.needsUpdate = true

        this.updateRotPosition()
    }

    _boneWorldMatrix:Matrix4 = new Matrix4()
    instanceMatrix:Matrix4 = new Matrix4()
    _tmpObject: Object3D = new Object3D()
    updateRotPosition(){
        const bone = this.targetBone!
        bone.updateWorldMatrix(true, true)
        const localMatrix = bone!.matrix
        this.instanceMatrix.copy(localMatrix)
        this.instanceMatrix.decompose( this._tmpObject.position, this._tmpObject.quaternion, this._tmpObject.scale )

        this._tmpObject.updateMatrixWorld()

        this.root.setMatrixAt(this.instanceIndex, this._tmpObject.matrixWorld)
    }

    get isNight(){
        return !this.walker.world.dayNightCycle.isDay
    }

    update(){
        if(this.root){
            this.updateRotPosition()
            this.root.instanceMatrix.needsUpdate = true

            // Handle light on nighttime
            if(this.isNight && !HandheldLantern.isVisible()){
                HandheldLantern.setVisible(true)
                HandheldLantern.turnOn()
            }else if (!this.isNight){
                HandheldLantern.turnOff()
                HandheldLantern.setVisible(false)
            }
        }
    }
}