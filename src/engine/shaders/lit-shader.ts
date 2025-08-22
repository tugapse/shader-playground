import { LitMaterial } from "@engine/materials/lit-material";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { Texture } from "../textures/texture";
import { Shader } from "./shader";
import { EngineCache } from "@engine/core/engineCache";
import { Camera } from "@engine/entities/camera";
import { ColorMaterial } from "@engine/materials/color-material";
export class LitShader extends Shader {
  static override instanciate(gl: WebGL2RenderingContext, material: LitMaterial): LitShader {
    return new LitShader(gl, material);
  }

  constructor(override gl: WebGL2RenderingContext, override material: LitMaterial) {
    super(
      gl, material,
      "assets/shaders/frag/phong.glsl",
      "assets/shaders/vertex/vertex.glsl")
  }


  override loadDataIntoShader(): void {
    if (!this.material) return;


    this.checkAndLoadTextures();
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color);
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset);

    this.setFloat(ShaderUniformsEnum.U_SPECULAR_STRENGTH, this.material.specularStrength);
    this.setFloat(ShaderUniformsEnum.U_ROUGHNESS, this.material.roughness);
    this.setFloat(ShaderUniformsEnum.U_NORMAL_MAP_STRENGTH, this.material.normalMapStrength);

    this.setVec3(ShaderUniformsEnum.U_CAMERA_POSITION, Camera.mainCamera.transform.position);

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
    super.loadDataIntoShader();
  }


  private checkAndLoadTextures() {

    if (!this.material.mainTex && this.material.mainTexUrl) {
      this.material.mainTex = EngineCache.getTexture2D(this.material.mainTexUrl, this.gl)
    } else if (!this.material.mainTex && !this.material.mainTexUrl) {
      this.material.mainTex = Texture.getDefaultWhiteTexture(this.gl);
    }

    if (!this.material.normalTex && this.material.normalTexUrl) {
      this.material.normalTex = EngineCache.getTexture2D(this.material.normalTexUrl, this.gl)
    } else if (!this.material.normalTex && !this.material.normalTexUrl) {
      this.material.normalTex = Texture.getDefaultWhiteTexture(this.gl);
    }
  }
}
