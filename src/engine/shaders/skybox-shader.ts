import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { CubemapMaterial } from "../materials/cubemap-material";
import { CubemapTexture } from "../textures/cubemap-texture";
import { Shader } from "./shader";

/**
  A shader designed specifically for rendering skyboxes using a cubemap texture.
 * @augments {Shader}
 */
export class SkyboxShader extends Shader {

  protected override _className = "SkyboxShader"

  /**
    Creates a new instance of SkyboxShader.
    
   * @override
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {CubemapMaterial} material - The cubemap material associated with this shader.
   * @returns {SkyboxShader} - A new SkyboxShader instance.
   */
  public static override instanciate(gl: WebGL2RenderingContext, material: CubemapMaterial): SkyboxShader {
    return new SkyboxShader(gl, material);
  }

  /**
    The cubemap material associated with this shader.
   * @type {CubemapMaterial}
   */
  public declare material: CubemapMaterial;

  /**
    Initializes the shader by setting the correct file paths for the vertex and fragment shaders before calling the parent initialize method.
   * @override
   * @returns {Promise<void>}
   */
  public override initialize(): Promise<void> {
    this.fragUri = "assets/shaders/frag/skybox.frag";
    this.vertexUri = "assets/shaders/vertex/skybox.vert";
    if (!this.material.mainTex) {
      this.material.mainTex = new CubemapTexture(this.gl);
    }
    return super.initialize();
  }

  /**
    Loads the cubemap material's properties into the shader's uniforms.
   * This includes the base color and the cubemap texture.
   * @override
   * @returns {void}
   */
  public override loadDataIntoShader(): void {
    if (!this.material) return;

    if (!this.material.mainTex.isImageLoaded) {
      this.material.mainTex.setGL(this.gl);
      this.material.mainTex.load();
    }

    super.loadDataIntoShader();
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color.toVec4());

    if (this.material.mainTex && this.material.mainTex.isImageLoaded) {
      this.material.mainTex.bind();
      this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex as CubemapTexture, 0);
    }
  }


  /**
    Binds a cubemap texture to a uniform in the shader.
   * @override
   * @param {string} name - The name of the uniform.
   * @param {CubemapTexture} texture - The cubemap texture object.
   * @param {number} textureIndex - The texture unit index to bind to.
   * @returns {void}
   */
  public override setTexture(name: string, texture: CubemapTexture, textureIndex: number): void {
    const location = this.gl.getUniformLocation(this._shaderProgram, name);
    if (location) {
      this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
      texture.bind();
      this.gl.uniform1i(location, textureIndex);
    }
  }
}