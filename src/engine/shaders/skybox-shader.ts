import { Color } from "@engine/core/color";
import { Vector3 } from "@engine/core/vector";
import { SkyboxMaterial } from "@engine/materials/skybox-material";
import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { CubemapMaterial } from "../materials/cubemap-material";
import { CubemapTexture } from "../textures/cubemap-texture";
import { Shader } from "./shader";
import { JsonSerializedData } from "@engine/interfaces";

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
  public declare material: SkyboxMaterial;

  // Sun properties to be passed as uniforms
  public useSun: boolean = true;
  public sunDirection: Vector3 = new Vector3(0, 1, 0);
  public sunColor: Color = new Color(1, 1, 1, 1);
  public sunSize: number = 0.999;
  public sunFalloff: number = 0.03;

  // Moon properties
  public useMoon: boolean = true;
  public moonDirection: Vector3 = new Vector3(0, -1, 0);
  public moonColor: Color = new Color(0.8, 0.9, 1.0, 1.0); // Pale bluish-white
  public moonSize: number = 0.998;     // Slightly smaller than the sun
  public moonFalloff: number = 0.002;  // Crisper edge than the sun
  public moonPhase: number = 0.0;
  public moonEarthshine: number = 0.02;
  public moonTerminatorSoftness: number = 0.5;
  public moonEnableRotation: number = 1;
  public moonRotationSpeed: number = 0.05;

  public useClouds = true;
  public cloudSpeed = 0.1;
  public cloudRepetition = 0;
  /** The tiling/scale of the clouds. Higher values make clouds smaller and more repetitive. */
  public cloudTiling = 0.4;
  public cloudSeed = 10.0;
  /** The sparsity of clouds. 0 is default, 1 is very sparse. */
  public cloudSparsity = 0.01;
  public wheatherCondition = 0.4;

  public useStars = true;
  /** The overall brightness of the stars. */
  public starIntensity = 3.0;
  /** Size/frequency of star cells (higher = smaller stars). */
  public starScale = 200.0;
  /** Noise exponent threshold at night (higher = fewer stars). */
  public starSparsity = 34.0;
  /** Rotational speed of the starfield. */
  public starSpeed = 0.004;




  /**
    Initializes the shader by setting the correct file paths for the vertex and fragment shaders before calling the parent initialize method.
   * @override
   * @returns {Promise<void>}
   */
  public override initialize(): Promise<boolean> {
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
  public override async loadDataIntoShader(): Promise<void> {
    if (!this.material) return; // Material must be present
    this.use()

    // Await texture loading
    if (this.material.mainTex) {
      if (!this.material.mainTex.isImageLoaded) {
        this.material.mainTex.setGL(this.gl);
        await this.material.mainTex.load();
      }else{
        this.setTexture(ShaderUniformsEnum.U_MAIN_TEX, this.material.mainTex as CubemapTexture, 0);
        this.material.mainTex.bind();
      }

    }

    super.loadDataIntoShader();

    // Set sun uniforms from the shader's properties
    this.setVec3(ShaderUniformsEnum.U_SUN_DIRECTION, this.sunDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_SUN_COLOR, this.sunColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_SUN_SIZE, this.sunSize);
    this.setFloat(ShaderUniformsEnum.U_SUN_FALLOFF, this.sunFalloff);
    this.setInt(ShaderUniformsEnum.U_USE_SUN, this.useSun ? 1 : 0);

    this.setVec3(ShaderUniformsEnum.U_MOON_DIRECTION, this.moonDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_MOON_COLOR, this.moonColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_MOON_SIZE, this.moonSize);
    this.setFloat(ShaderUniformsEnum.U_MOON_FALLOFF, this.moonFalloff);
    this.setFloat(ShaderUniformsEnum.U_MOON_PHASE, this.moonPhase);
    this.setInt(ShaderUniformsEnum.U_USE_MOON, this.useMoon ? 1 : 0);

    this.setFloat(ShaderUniformsEnum.U_MOON_EARTHSHINE, this.moonEarthshine);
    this.setFloat(ShaderUniformsEnum.U_MOON_TERMINATOR_SOFTNESS, this.moonTerminatorSoftness);
    this.setInt(ShaderUniformsEnum.U_MOON_ENABLE_ROTATION, this.moonEnableRotation);
    this.setFloat(ShaderUniformsEnum.U_MOON_ROTATION_SPEED, this.moonRotationSpeed);
    
    this.setVec4(ShaderUniformsEnum.U_SKY_COLOR, this.material.color.toVec4());
    this.setVec4(ShaderUniformsEnum.U_HORIZON_COLOR, this.material.horizonColor.toVec4());
    this.setVec4(ShaderUniformsEnum.U_GROUND_COLOR, this.material.groundColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_EXPONENT, this.material.exponent);
    
    this.setInt(ShaderUniformsEnum.U_CLOUD_REPETITION, this.cloudRepetition);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SPEED, this.cloudSpeed);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_TILING, this.cloudTiling);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SEED, this.cloudSeed);
    this.setInt(ShaderUniformsEnum.U_USE_CLOUDS, this.useClouds ? 1 : 0);
    this.setFloat(ShaderUniformsEnum.U_WHEATHER_CONDITION, this.wheatherCondition);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SPARSITY, this.cloudSparsity);

    this.setInt(ShaderUniformsEnum.U_USE_STARS, this.useStars ? 1 : 0);
    this.setFloat(ShaderUniformsEnum.U_STAR_INTENSITY, this.starIntensity);
    this.setFloat(ShaderUniformsEnum.U_STAR_SCALE, this.starScale);
    this.setFloat(ShaderUniformsEnum.U_STAR_SPARSITY, this.starSparsity);
    this.setFloat(ShaderUniformsEnum.U_STAR_SPEED, this.starSpeed);
    this.release();
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

  override release(): void {
    this.material.mainTex?.unBind();
  }


}
