import { vec4 } from "gl-matrix";
import { Material } from "./material";
import { CubeMapTexture } from "@engine/textures/cubemap-texture";

export class CubemapMaterial extends Material {

  public color: vec4 = vec4.fromValues(1, 1, 1, 1);
  public rightSideUri: string = "";
  public leftSideUri: string = "";
  public topSideUri: string = "";
  public bottomSideUri: string = "";
  public backSideUri: string = "";
  public frontSideUri: string = "";
  public mainTex!: CubeMapTexture;
}
