import { Mesh, SkinnedMesh } from "three";


export function applyTransforms(mesh:Mesh|SkinnedMesh){
    mesh.updateMatrix(); //make sure matrix is up to date with position/rotation/scale
    mesh.geometry.applyMatrix4(mesh.matrix); //Transform the geometry itself by that matrix...
    mesh.matrix.identity(); //Reset the matrix to identity now...
    mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale) //synchronise the position/quat/scale of the object.
}



export function gaussianRandom(mean = 0, stdev = 1): number {
  const u = 1 - Math.random() // Converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  // Transform to the desired mean and standard deviation:
  return Math.max(0, Math.min(1, z * stdev + mean))
}