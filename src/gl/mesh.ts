import { Material } from "./material";
import { Shader } from "./shader";
import { Vec2, Vec3 } from "./vec";

export class MeshData{
    constructor(public vertices:Vec3[],public normals:Vec3[],public uvs:Vec2[]){}
}

export class Mesh{
  public meshData!:MeshData;
  public material!: Material;
  public shader!: Shader;
}

