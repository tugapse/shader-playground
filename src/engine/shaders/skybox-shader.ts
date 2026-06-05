import { vec3, vec4 } from "gl-matrix";
import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { CubemapMaterial } from "../materials/cubemap-material";
import { CubemapTexture } from "../textures/cubemap-texture";
import { Shader } from "./shader";
import { Vector3, Vector4 } from "@engine/core/vector";
import { Color } from "@engine/core/color";

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

  // Sun properties to be passed as uniforms
  public _sunDirection: Vector3 = new Vector3(0, 1, 0);
  public _sunColor: Color = new Color(1, 1, 1, 1);
  public _sunSize: number = 0.999;
  public _sunFalloff: number = 0.01;
  public _useSun: number = 0;

  // Moon properties
  public _moonDirection: Vector3 = new Vector3(0, -1, 0);
  public _moonColor: Color = new Color(0.8, 0.9, 1.0, 1.0); // Pale bluish-white
  public _moonSize: number = 0.998;     // Slightly smaller than the sun
  public _moonFalloff: number = 0.002;  // Crisper edge than the sun
  public _moonPhase: number = 0.0;
  public _useMoon: number = 1;

  // Procedural sky properties
  public skyColor: Color = new Color(0.35, 0.53, 0.7, 1.0);
  public horizonColor: Color = new Color(0.7, 0.75, 0.8, 1.0); 
  public groundColor: Color = new Color(0.2, 0.2, 0.2, 1.0);
  public exponent: number = 0.6;

  /**
    Initializes the shader by setting the correct file paths for the vertex and fragment shaders before calling the parent initialize method.
   * @override
   * @returns {Promise<void>}
   */
  public override initialize(): Promise<void> {
    this.fragUri = "assets/shaders/frag/skybox.frag";
    this.vertexUri = "assets/shaders/vertex/skybox.vert";
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

    if (this.material.mainTex) {

      if (!this.material.mainTex.isImageLoaded) {
        this.material.mainTex.setGL(this.gl);
        this.material.mainTex.load();
      }else{
        this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex as CubemapTexture, 0);
        this.material.mainTex.bind();
      }

    }
    super.loadDataIntoShader();

    // Set sun uniforms from the shader's properties
    this.setVec3(ShaderUniformsEnum.U_SUN_DIRECTION, this._sunDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_SUN_COLOR, this._sunColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_SUN_SIZE, this._sunSize);
    this.setFloat(ShaderUniformsEnum.U_SUN_FALLOFF, this._sunFalloff);
    this.setInt(ShaderUniformsEnum.U_USE_SUN, this._useSun);

    this.setVec3(ShaderUniformsEnum.U_MOON_DIRECTION, this._moonDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_MOON_COLOR, this._moonColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_MOON_SIZE, this._moonSize);
    this.setFloat(ShaderUniformsEnum.U_MOON_FALLOFF, this._moonFalloff);
    this.setFloat(ShaderUniformsEnum.U_MOON_PHASE, this._moonPhase);
    this.setInt(ShaderUniformsEnum.U_USE_MOON, this._useMoon);

    this.setVec4(ShaderUniformsEnum.U_SKY_COLOR, this.skyColor.toVec4());
    this.setVec4(ShaderUniformsEnum.U_HORIZON_COLOR, this.horizonColor.toVec4());
    this.setVec4(ShaderUniformsEnum.U_GROUND_COLOR, this.groundColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_EXPONENT, this.exponent);
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
