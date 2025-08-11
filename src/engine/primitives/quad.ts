import { vec2 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class QuadPrimitive extends MeshData{
  constructor(){
    const vertices:vec2[] = [
        [-1.0, -1.0],  // Bottom-left
        [ 1.0, -1.0],  // Bottom-right
        [-1.0,  1.0],  // Top-left
        [-1.0,  1.0],  // Top-left
        [ 1.0, -1.0],  // Bottom-right
        [ 1.0,  1.0]   // Top-right
      ];
    const normals:vec2[]= [];
    const uvs:vec2[] = [];
    super(vertices,normals,uvs)
  }


}
