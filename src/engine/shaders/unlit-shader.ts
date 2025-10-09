import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { UnlitMaterial } from "../materials/unlit-material";
import { Texture } from "../textures/texture";
import { Shader } from "./shader";

/**
  Represents a shader specifically designed for rendering objects with an unlit material. It handles uniforms for color, texture, and UV transformations.
 * @augments {Shader}
 */
export class UnlitShader extends Shader {

  protected override _className = "UnlitShader"

  /**
    Creates a new instance of UnlitShader.
    
   * @override
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {UnlitMaterial} material - The unlit material associated with this shader.
   * @returns {UnlitShader} - A new UnlitShader instance.
   */
  public static override instanciate(gl: WebGL2RenderingContext, material: UnlitMaterial): UnlitShader {
    return new UnlitShader(gl, material);
  }

  /**
    Creates an instance of UnlitShader.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {UnlitMaterial} material - The unlit material.
   */
  constructor(override gl: WebGL2RenderingContext, override material: UnlitMaterial) {
    super(gl, material, "assets/shaders/frag/unlit.frag", "assets/shaders/vertex/vertex.vert");
  }

  /**
    Loads the unlit material's properties into the shader's uniforms.
   * This includes the base color, UV scale and offset, and the main texture.
   * @override
   * @returns {void}
   */
  public override loadDataIntoShader(): void {
    
    if (!this.material) return;
    
    if (this.material.mainTex && !this.material.mainTex.isImageLoaded) {
      this.material.mainTex.setGL(this.gl);
      this.material.mainTex.load();
    }
    
    super.loadDataIntoShader();
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color.toVec4());
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale.vector);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset.vector);

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.material.mainTex.bind();
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex, 0);
    }
  }

  override release(): void {
    super.release();
    if(this.material?.mainTex)
      this.material.mainTex.unBind();
  }


}