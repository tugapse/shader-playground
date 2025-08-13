import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { UnlitMaterial } from "../materials/unlit-material";
import { Material } from "../materials/material";
import { Texture } from "../materials/texture";
import { Shader } from "./shader";
export class UnlitShader extends Shader {


  constructor(override gl: WebGLRenderingContext, override material: Material) {
    super(gl, material,
      "assets/shaders/frag/unlit.glsl",
      "assets/shaders/vertex/vertex.glsl")
  }

  override loadDataIntoShader(): void {
    const material = this.material as UnlitMaterial;
    if(! material) return;


    if(!material.mainTex && material.mainTexUrl ){
      material.mainTex = new Texture(this.gl);
      material.mainTex.load(material.mainTexUrl);
    }else if (!material.mainTex?.isImageLoaded && material.mainTexUrl ) {
          material.mainTex.load(material.mainTexUrl);
    }

    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, material.color);
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, material.uvScale);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, material.uvOffset);

    if(material.mainTex && material.mainTex.isImageLoaded){
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX,material.mainTex,0);
    }

  }
}
