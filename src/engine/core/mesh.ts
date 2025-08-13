import { vec2, vec3 } from "gl-matrix";
import { ColorMaterial } from "../materials/color-material";
import { Shader } from "../shaders/shader";

export class MeshData{
    constructor(public vertices:vec3[],public normals:vec3[],public uvs:vec2[]){}
}

export class Mesh{
  public meshData!:MeshData;
}

