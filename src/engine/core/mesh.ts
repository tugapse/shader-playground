import { vec2, vec3 } from "gl-matrix";
import { Material } from "./material";
import { Shader } from "./shader";

export class MeshData{
    constructor(public vertices:vec3[],public normals:vec3[],public uvs:vec2[]){}
}

export class Mesh{
  public meshData!:MeshData;
}

