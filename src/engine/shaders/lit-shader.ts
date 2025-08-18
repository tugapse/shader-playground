import { LitMaterial } from "@engine/materials/lit-material";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { Texture } from "../textures/texture";
import { Shader } from "./shader";
import { EngineCache } from "@engine/core/storage";
export class LitShader extends Shader {


  constructor(override gl: WebGL2RenderingContext, override material: LitMaterial) {
    super(
      gl, material,
      "assets/shaders/frag/lit.glsl",
      "assets/shaders/vertex/vertex.glsl")
  }


  override loadDataIntoShader(): void {
    if (!this.material) return;


    this.checkAndLoadTextures();
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color);
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset);

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
    super.loadDataIntoShader();
  }

  private checkAndLoadTextures() {

    if (!this.material.mainTex && this.material.mainTexUrl) {
      this.material.mainTex = EngineCache.getTexture2D(this.material.mainTexUrl,this.gl)
    }else if(!this.material.mainTex && !this.material.mainTexUrl){
      this.material.mainTex = Texture.getDefaultWhiteTexture(this.gl);
    }

    if (!this.material.normalTex && this.material.normalTexUrl) {
      this.material.normalTex = EngineCache.getTexture2D(this.material.normalTexUrl,this.gl)
    }else if(!this.material.normalTex && !this.material.normalTexUrl){
      this.material.normalTex = Texture.getDefaultWhiteTexture(this.gl);
    }
  }
}
