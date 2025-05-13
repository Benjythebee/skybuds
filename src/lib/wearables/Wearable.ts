import { Bone, DynamicDrawUsage, InstancedMesh, Matrix4, Mesh, Object3D, Quaternion, Scene, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Walker } from "../Walker";
import { applyTransforms } from "../utils/utils";
import { ITEMS_LIST, WearableID, WearableType, WearableWithIndex } from "./items";

export class WearableHat{
    static GLTFLoader = new GLTFLoader()
    static roots:Record<WearableID,InstancedMesh> = {} as any // Cache the loaded objects
    root:InstancedMesh = null!
    instanceIndex = 0
    position:Vector3 = new Vector3(0, 0, 0)
    rotation:Vector3 = new Vector3(0, 0, 0)
    wearableData:WearableWithIndex
    constructor(public scene:Scene,public walker:Walker,public wearableID:WearableID){

        if(!ITEMS_LIST[wearableID]){
            throw new Error(`WearableHat: ${wearableID} is not a valid hat name`)
        }

        this.wearableData = {
            ...ITEMS_LIST[wearableID],
            index:wearableID
        }

        if(!WearableHat.roots[wearableID]){
            // Load a root object and then generate instance of it
            WearableHat.GLTFLoader.loadAsync(this.wearableData.url).then((gltf) => {
                const group = gltf.scene
                let mesh:Mesh=null!
                 group.traverse((child) => {
                    if ((child as Mesh).isMesh) {
                        mesh = child as Mesh
                    }
                })
                if(!mesh){
                    throw new Error(`WearableHat: ${wearableID} has no mesh`)
                }
                mesh.removeFromParent()
                mesh.scale.set(this.wearableData.scale, this.wearableData.scale, this.wearableData.scale)
                applyTransforms(mesh)

                const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, 1000)
                instancedMesh.instanceMatrix.setUsage( DynamicDrawUsage )
                instancedMesh.frustumCulled = false
                this.scene.add(instancedMesh)
                WearableHat.roots[wearableID] = instancedMesh
                
                // set local:
                this.instanceIndex = 0
                instancedMesh.count = 1
                this.root = instancedMesh
                WearableHat.updateInstanceMap(this.wearableID, this.instanceIndex, this)
                this.updateRotPosition()
                
            })
        }else{
            this.root = WearableHat.roots[wearableID]
            this.createInstance()
        }
        this.targetBone?.add(this._tmpObject)
    }

    get targetBone(){
        const boneName = this.wearableData.bone
        const bone = this.walker.getBone(boneName)
        if(!bone){
            throw new Error(`WearableHat: ${this.wearableID} has no bone ${boneName}`)
        }
        return bone
    }

    get nudge(){
        const nudge = this.wearableData.positionNudge
        return new Vector3(nudge.x, nudge.y, nudge.z)
    }

    static updateInstanceMap(wearableID:WearableID,instanceNumber:number, instance:WearableHat){
        if(!WearableHat.roots[wearableID].userData){
            WearableHat.roots[wearableID].userData = {}
        }
        WearableHat.roots[wearableID].userData[instanceNumber] = instance
    }
    
    static dispose (waerableHat:WearableHat){
        const root = WearableHat.roots[waerableHat.wearableID]

        /**
         * When a hat is removed, the count will be going down
         * This means the instance index of the rest of the hats NEEDS to be updated
         */

        const indexToReplace = waerableHat.instanceIndex // get current index, for example 4
        const instanceAtLastIndex = root.userData[root.count - 1] as WearableHat // get the last index, for example 5

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
        const root = WearableHat.roots[this.wearableID]
        if(!root){
            throw new Error(`WearableHat: ${this.wearableID} is not loaded yet`)
        }

        this.instanceIndex = root.count
        root.count++
        WearableHat.updateInstanceMap(this.wearableID, this.instanceIndex, this)
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

        this._tmpObject.position.add(this.nudge)
        
        this._tmpObject.updateMatrixWorld()


        this.root.setMatrixAt(this.instanceIndex, this._tmpObject.matrixWorld)
    }

    update(){
        if(this.root){
            this.updateRotPosition()
            this.root.instanceMatrix.needsUpdate = true
        }
    }

    static updateAll(){
        for (const id in WearableHat.roots) {
            const root = WearableHat.roots[parseInt(id) as WearableID]
            if (root) {
                for(let i = 0; i < root.count; i++){
                    const hat = root.userData[i] as WearableHat
                    hat.updateRotPosition()
                }
                
                root.instanceMatrix.needsUpdate = true
            }
        }
    }
}