import {Vector3,Quaternion,PerspectiveCamera,Camera, Object3D, SkinnedMesh, Bone, Skeleton, Euler, Box3} from 'three'


const localVector = new Vector3()
type boneName = 'head' | 'neck' | 'chest' | 'hips' | 'spine' | "upper_legL" | "lower_legL" | "footL" | "upper_legR" | "lower_legR" | "footR"
/**
 * Handles camera framing for different shot types.
 */
export default class CameraFrameManager {

  frameOffset: { min: number; max: number; }= {
    min: 0.05,
    max: 0.05,
  };

  boneOffsets: Record<boneName, { min: Vector3; max: Vector3; } | null>

  cameraDir = new Vector3()

  constructor(public camera: PerspectiveCamera) {
    this.camera = camera|| new PerspectiveCamera()


    this.boneOffsets = {
      head: null,
      neck: null,
      chest: null,
      hips: null,
      spine: null,
      upper_legL: null,
      upper_legR: null,
      footL: null,
      lower_legL: null,
      lower_legR: null,
      footR: null,
    }
  }

  setupCamera(cameraPosition: Vector3, lookAtPosition: Vector3, fieldOfView: number = 30) {
    this.camera.position.copy(cameraPosition)
    this.camera.lookAt(lookAtPosition)
    this.camera.fov = fieldOfView
  }


  async calculateBoneOffsets(object: Object3D, minWeight: number) {
    for (const boneName in this.boneOffsets) {
      // Use await to wait for the promise to resolve
      const result = await this._getMinMaxOffsetByBone(object, boneName as boneName, minWeight)
      // Store the result in the boneOffsets property
      this.boneOffsets[boneName as boneName] = result
    }
  }

  /**
   * @type {Object3D|null}
   */
  frameTarget: Object3D | null = null
  /**
   * Sets the target for the frame() methods
   * @param {Object3D|null} object 
   */
  setFrameTarget(object: Object3D | null){
    this.frameTarget = object;
  }

  frameCloseupShot() {
    this.frameShot( 'head', 'head')
  }

  frameMediumShot() {
    this.frameShot( 'chest', 'head')
  }

  frameCowboyShot() {
    this.frameShot( 'hips', 'head')
  }

  frameFullShot() {
    this.frameShot('footL', 'head')
  }

  frameShot( minBoneName: boneName, maxBoneName: boneName, cameraPosition: Vector3 | null = null, minGetsMaxVertex: boolean = false, maxGetsMaxVertex: boolean = true) {
    if(!this.frameTarget){
        console.error("No target object provided, Call setFrameTarget() first;")
        return;
    }
    const min = this._getBoneWorldPositionWithOffset(this.frameTarget, minBoneName, minGetsMaxVertex)
    const max = this._getBoneWorldPositionWithOffset(this.frameTarget, maxBoneName, maxGetsMaxVertex)
    min.y -= this.frameOffset.max
    max.y += this.frameOffset.min

    cameraPosition = cameraPosition || new Vector3(0, 0, 0)

    this.positionCameraBetweenPoints(min, max, cameraPosition)
  }
  /**
   * 
   * @param {number} min 
   */
  setBottomFrameOffset(min: number) {
    this.frameOffset.min = min
  }
    /**
     *  
     * @param {number} max
     *  
     * */
  setTopFrameOffset(max: number) {
    this.frameOffset.max = max
  }

  _getBoneWorldPositionWithOffset(targetObject: Object3D,boneName: boneName, getMax: boolean) {
    const bone = this._getFirstBoneWithName( boneName,targetObject)
    if (!bone || !this.boneOffsets[boneName]) {
      console.error(`Bone with name '${boneName}' not found in the model.`)
      return new Vector3()
    }
    const boneWorldPosition = new Vector3()
    bone.getWorldPosition(boneWorldPosition)

    const offset = getMax ? this.boneOffsets[boneName].max : this.boneOffsets[boneName].min
    boneWorldPosition.y += offset.y

    return boneWorldPosition
  }

  _getFirstBoneWithName(boneName: boneName,targetObject: Object3D | undefined=undefined):Bone|null {

    let resultBone: Bone | null= null
    const target= targetObject||this.frameTarget
    if(!target){
        console.error("_getFirstBoneWithName: No target object provided, Call setFrameTarget() first or provide a targetObject parameter;")
        return null;
    }

    target.traverse((child) => {
      if (child instanceof SkinnedMesh) {
        if (!child.geometry) {
          console.error('Invalid skinned mesh found in children.')
          return
        }

        const boneIndex = child.skeleton.bones.findIndex((bone) => bone.name === boneName)

        if (boneIndex !== -1) {
          resultBone = child.skeleton.bones[boneIndex]
          // Break out of the loop since we found the bone
          return
        }
      }
    })
    return resultBone as Bone|null
  }

  async _getMinMaxOffsetByBone(parent: Object3D, boneName: boneName, minWeight: number) {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<{ min: Vector3, max: Vector3 }>( async (resolve, reject) => {
      // Ensure parent is valid
      if (!parent || !parent.traverse) {
        console.error('Invalid parent object provided.')
        reject(null)
      }

      // Initialize min and max offset vectors
      const minOffset = new Vector3(Infinity, Infinity, Infinity)
      const maxOffset = new Vector3(-Infinity, -Infinity, -Infinity)

      const prevPos: any[] = []
      // Pause springBones
      parent.traverse(async (child) => {
        if (child instanceof SkinnedMesh) {
          prevPos.push(this._saveBonesPos(child.skeleton))
          child.skeleton.pose()
        }
      })
      let prevPosCount = 0

      await delay(10)
      // Traverse all children of the parent
      parent.traverse((child) => {
        if (child instanceof SkinnedMesh) {
          // Ensure each SkinnedMesh has geometry
          if (!child.geometry) {
            console.error('Invalid skinned mesh found in children.')
            return
          }

          // Find the index of the bone by name
          const boneIndex = child.skeleton.bones.findIndex((bone) => bone.name === boneName)

          // Check if the bone with the given name exists
          if (boneIndex === -1) {
            console.error(`Bone with name '${boneName}' not found in one of the skinned meshes.`)
            return
          }

          const positionAttribute = child.geometry.getAttribute('position')
          const skinWeightAttribute = child.geometry.getAttribute('skinWeight')
          const skinIndexAttribute = child.geometry.getAttribute('skinIndex')

          // Iterate through each vertex
          for (let i = 0; i < positionAttribute.count; i++) {
            const worldVertex = new Vector3().fromBufferAttribute(positionAttribute, i).applyMatrix4(child.matrixWorld)

            // Check the influence of the bone on the vertex
            const skinIndex = skinIndexAttribute.getX(i)

            if (skinIndex === boneIndex) {
              // Get the weight of the bone influence
              const influence = skinWeightAttribute.getX(i)

              // If the influence is above the minimum weight
              if (influence >= minWeight) {
                // Calculate offset from the bone's position difference
                const bone = child.skeleton.bones[boneIndex]
                const bonePosition = new Vector3().setFromMatrixPosition(bone.matrixWorld)
                const offset = worldVertex.clone().sub(bonePosition)

                // Update min and max offset vectors
                minOffset.min(offset)
                maxOffset.max(offset)
              }
            }
          }
          this._restoreSavedPose(prevPos[prevPosCount], child.skeleton)
          prevPosCount++
        }
      })

      // Resolve with min and max offset vectors
      resolve({ min: minOffset, max: maxOffset })
    })
  }

  _saveBonesPos(skeleton: Skeleton) {

    let savedPose: { position: Vector3; rotation: Euler; scale: Vector3; }[] = []
    skeleton.bones.forEach((bone) => {
      savedPose.push({
        position: bone.position.clone(),
        rotation: bone.rotation.clone(),
        scale: bone.scale.clone(),
      })
    })
    return savedPose
  }

  _restoreSavedPose(savedPose:any, skeleton:Skeleton) {
    if (savedPose) {
      skeleton.bones.forEach((bone, index) => {
        bone.position.copy(savedPose[index].position)
        bone.rotation.copy(savedPose[index].rotation)
        bone.scale.copy(savedPose[index].scale)
      })
    }
  }

  positionCameraBetweenPoints(vector1: Vector3, vector2: Vector3, cameraPosition: Vector3, fieldOfView: number = 30) {
    const boundingBox = new Box3()
    boundingBox.expandByPoint(vector1)
    boundingBox.expandByPoint(vector2)

    this.camera.fov = fieldOfView

    const verticalFOV = this.camera.fov * (Math.PI / 180)

    const diagonalDistance = boundingBox.getSize(new Vector3()).length()

    const distance = diagonalDistance / (2 * Math.tan(verticalFOV / 2))

    boundingBox.getCenter(localVector)
    // Set the camera's position and lookAt
    this.camera.position.copy(localVector)

    cameraPosition.y *= 0.5

    this.camera.lookAt(localVector.clone().sub(cameraPosition)) // adjust lookAt position if needed

    // Adjust the camera position based on the calculated distance
    const direction = new Vector3()
    this.camera.getWorldDirection(direction)
    this.camera.position.addScaledVector(direction, -distance)

    // Update the camera's projection matrix to ensure proper rendering
    this.camera.updateProjectionMatrix()
  }

}
