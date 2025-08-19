import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { CubeMapTexture } from "@engine/textures/cubemap-texture";
import { ColorMaterial } from "./color-material";

export class CubemapMaterial extends ColorMaterial implements JsonSerializable {

  public rightSideUri: string = "assets/images/skybox/blue/right.jpeg";
  public leftSideUri: string = "assets/images/skybox/blue/left.jpeg";
  public topSideUri: string = "assets/images/skybox/blue/top.jpeg";
  public bottomSideUri: string = "assets/images/skybox/blue/bottom.jpeg";
  public backSideUri: string = "assets/images/skybox/blue/back.jpeg";
  public frontSideUri: string = "assets/images/skybox/blue/front.jpeg";
  public mainTex!: CubeMapTexture;

  override fromJson(jsonObject: { [key: string]: any; }): void {

  }
  override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      rightSideUri: this.rightSideUri,
      leftSideUri: this.leftSideUri,
      topSideUri: this.topSideUri,
      bottomSideUri: this.bottomSideUri,
      backSideUri: this.backSideUri,
      frontSideUri: this.frontSideUri
    }
  }
}
