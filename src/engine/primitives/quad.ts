import { MeshData } from "../core/mesh";
import { Vec2 } from "../core/vec";

export class QuadPrimitive extends MeshData{
  constructor(){
    const vertices:Vec2[] = [
        new Vec2 (-1.0, -1.0),  // Bottom-left
        new Vec2 ( 1.0, -1.0),  // Bottom-right
        new Vec2 (-1.0,  1.0),  // Top-left
        new Vec2 (-1.0,  1.0),  // Top-left
        new Vec2 ( 1.0, -1.0),  // Bottom-right
        new Vec2 ( 1.0,  1.0)   // Top-right
      ];
    const normals:Vec2[]= [];
    const uvs:Vec2[] = [];
    super(vertices,normals,uvs)
  }


}
