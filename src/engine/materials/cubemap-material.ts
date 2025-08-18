import { vec4 } from "gl-matrix";
import { Material } from "./material";
import { CubeMapTexture } from "@engine/textures/cubemap-texture";

export class CubemapMaterial extends Material {

  public color: vec4 = vec4.fromValues(1, 1, 1, 1);
  public rightSideUri: string = "assets/images/skybox/blue/right.jpeg";
  public leftSideUri: string = "assets/images/skybox/blue/left.jpeg";
  public topSideUri: string = "assets/images/skybox/blue/top.jpeg";
  public bottomSideUri: string = "assets/images/skybox/blue/bottom.jpeg";
  public backSideUri: string = "assets/images/skybox/blue/back.jpeg";
  public frontSideUri: string = "assets/images/skybox/blue/front.jpeg";
  public mainTex!: CubeMapTexture;
}
