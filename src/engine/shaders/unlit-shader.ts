import { Texture } from "../textures/texture";
import { UnlitMaterial } from "../materials/unlit-material";
import { Shader } from "./shader";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
export class UnlitShader extends Shader {


  constructor(override gl: WebGLRenderingContext, override material: UnlitMaterial) {
    super(gl, material,
      "assets/shaders/frag/unlit.glsl",
      "assets/shaders/vertex/vertex.glsl")
  }

  override loadDataIntoShader(): void {
    if (!this.material) return;


    if (!this.material.mainTex && this.material.mainTexUrl) {
      this.material.mainTex = new Texture(this.gl,this.material.mainTexUrl);
      this.material.mainTex.load();
    } else if (!this.material.mainTex?.isImageLoaded && this.material.mainTexUrl) {
      this.material.mainTex.load();
    }

    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color);
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset);

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
    super.loadDataIntoShader();
  }
}
