import { LitMaterial } from "@engine/materials/lit-material";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { Texture } from "../materials/texture";
import { Shader } from "./shader";
export class LitShader extends Shader {


  constructor(override gl: WebGLRenderingContext, override material: LitMaterial) {
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

  }

  private checkAndLoadTextures() {
    if (!this.material.mainTex && this.material.mainTexUrl) {
      this.material.mainTex = new Texture(this.gl);
      this.material.mainTex.load(this.material.mainTexUrl);
    } else if (!this.material.mainTex?.isImageLoaded && this.material.mainTexUrl) {
      this.material.mainTex.load(this.material.mainTexUrl);
    }else if(!this.material.mainTex && !this.material.mainTexUrl){
      this.material.mainTex = Texture.createDefaultWhiteTexture(this.gl);
    }

    if (!this.material.normalTex && this.material.normalTexUrl) {
      this.material.normalTex = new Texture(this.gl);
      this.material.normalTex.load(this.material.normalTexUrl);
    } else if (!this.material.normalTex?.isImageLoaded && this.material.normalTexUrl) {
      this.material.normalTex.load(this.material.normalTexUrl);
    }
  }
}
