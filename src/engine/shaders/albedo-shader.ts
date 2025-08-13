import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { AlbedoMaterial } from "../materials/albedo-material";
import { Material } from "../materials/material";
import { Shader } from "./shader";
export class AlbedoShader extends Shader {


  constructor(override gl: WebGLRenderingContext, override material: Material) {
    super(gl, material,
      "assets/shaders/frag/unlit.glsl",
      "assets/shaders/vertex/fullscreen.glsl")
  }


  override loadDataIntoShader(): void {
    const material = this.material as AlbedoMaterial;

    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, [1, 0.5, 0.3, 0.5]);
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, material.uvScale);

    if (!material.mainTex?.isImageLoaded) {

    }

  }
}
