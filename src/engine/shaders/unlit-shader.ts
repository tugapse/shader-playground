import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { UnlitMaterial } from "../materials/unlit-material";
import { Texture } from "../textures/texture";
import { Shader } from "./shader";
export class UnlitShader extends Shader {
  static override instanciate(gl: WebGL2RenderingContext, material: UnlitMaterial): UnlitShader {
    return new UnlitShader(gl, material);
  }


  constructor(override gl: WebGL2RenderingContext, override material: UnlitMaterial) {
    super(gl, material,
      "assets/shaders/frag/unlit.frag",
      "assets/shaders/vertex/vertex.vert")
  }

  override loadDataIntoShader(): void {
    if (!this.material) return;


    if (!this.material.mainTex && this.material.mainTexUrl) {
      this.material.mainTex = new Texture(this.gl, this.material.mainTexUrl);
      this.material.mainTex.load();
    } else if (!this.material.mainTex?.isImageLoaded && this.material.mainTexUrl) {
      this.material.mainTex.load();
    }

    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color.toVec4());
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset);

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
    super.loadDataIntoShader();
  }
}
