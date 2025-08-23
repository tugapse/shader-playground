import { CubemapMaterial } from "@engine/materials/cubemap-material";
import { Shader } from "./shader";
import { CubeMapTexture } from "@engine/textures/cubemap-texture";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { ColorMaterial } from "@engine/materials/color-material";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";

export class SkyboxShader extends Shader {

  static override instanciate(gl: WebGL2RenderingContext, material: CubemapMaterial): SkyboxShader {
    return new SkyboxShader(gl, material);
  }

  declare material: CubemapMaterial;

  override initialize(): Promise<void> {
    this.fragUri = "assets/shaders/frag/skybox.frag";
    this.vertexUri = "assets/shaders/vertex/skybox.vert";
    return super.initialize();
  }

  override loadDataIntoShader(): void {
    if (!this.material) return;

    const { rightSideUri, leftSideUri, topSideUri, bottomSideUri, backSideUri, frontSideUri } = this.material;
    if (!this.material.mainTex) {
      this.material.mainTex = new CubeMapTexture(this.gl, [
        rightSideUri, leftSideUri,
        topSideUri, bottomSideUri,
        frontSideUri, backSideUri
      ]);
      this.material.mainTex.load();
    } else if (!this.material.mainTex.isImageLoaded) {
      this.material.mainTex.load();
    }

    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color.toVec4());

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
    super.loadDataIntoShader();
  }

  public override setTexture(name: string, texture: CubeMapTexture, textureIndex: number) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
      texture.bind();
      this.gl.uniform1i(location, textureIndex);
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.material = jsonObject['material'] as CubemapMaterial;
  }
}
