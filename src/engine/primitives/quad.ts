import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class QuadPrimitive extends MeshData{
  constructor(){
    const vertices:vec3[] = [
        [-1.0, -1.0,0],  // Bottom-left
        [ 1.0, -1.0,0],  // Bottom-right
        [-1.0,  1.0,0],  // Top-left
        [-1.0,  1.0,0],  // Top-left
        [ 1.0, -1.0,0],  // Bottom-right
        [ 1.0,  1.0,0]   // Top-right
      ];
    const normals:vec3[]= [];
    const uvs:vec2[] = [];
    super(vertices,normals,uvs)
  }


}
