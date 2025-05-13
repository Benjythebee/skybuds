import { Mesh, SkinnedMesh } from "three";


export function applyTransforms(mesh:Mesh|SkinnedMesh){
    mesh.updateMatrix(); //make sure matrix is up to date with position/rotation/scale
    mesh.geometry.applyMatrix4(mesh.matrix); //Transform the geometry itself by that matrix...
    mesh.matrix.identity(); //Reset the matrix to identity now...
    mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale) //synchronise the position/quat/scale of the object.
}