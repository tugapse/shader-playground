import { vec4 } from "gl-matrix";
import { Material } from "./material";
import { CubeMapTexture } from "@engine/textures/cubemap-texture";

export class CubemapMaterial extends Material {

  public color: vec4 = vec4.fromValues(1, 1, 1, 1);
  public rightSideUri: string = "assets/images/skybox/cloud/right.jpeg";
  public leftSideUri: string = "assets/images/skybox/cloud/left.jpeg";
  public topSideUri: string = "assets/images/skybox/cloud/top.jpeg";
  public bottomSideUri: string = "assets/images/skybox/cloud/bottom.jpeg";
  public backSideUri: string = "assets/images/skybox/cloud/back.jpeg";
  public frontSideUri: string = "assets/images/skybox/cloud/front.jpeg";
  public mainTex!: CubeMapTexture;
}
