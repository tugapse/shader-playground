import { Color } from "@engine/core/color";
import { Vector3 } from "@engine/core/vector";
import { SkyboxMaterial } from "@engine/materials/skybox-material";
import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { CubemapMaterial } from "../materials/cubemap-material";
import { CubemapTexture } from "../textures/cubemap-texture";
import { Shader } from "./shader";
import { JsonSerializedData } from "@engine/interfaces";
import { ShaderSources } from "./shader-sources";

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

  public sun = {
    useSun:false,
    sunDirection: new Vector3(0, 0.3, -10),
    sunColor: new Color(1, 1, 1, 1),
    sunSize: 0.999,
    sunFalloff: 0.03,
    
  }

  public moon = {
    useMoon:false,
    moonDirection: new Vector3(0, -1, 0),
    moonColor: new Color(0.8, 0.9, 1.0, 1.0), // Pale bluish-white
    moonSize: 0.998,     // Slightly smaller than the sun
    moonFalloff: 0.002,  // Crisper edge than the sun
    moonPhase: 0.0,
    moonEarthshine: 0.02,
    moonTerminatorSoftness: 0.5,
    moonEnableRotation: 1,
    moonRotationSpeed: 0.05,
  }

  clouds = {
    useClouds:false,
    cloudSpeed: 0.1,
    cloudRepetition: 0,
    cloudTiling: 0.4,
    cloudSeed: 10.0,
    cloudSparsity: 0.01,
    wheatherCondition: 0.4,
  }

  stars = {
    useStars:false,
    starIntensity: 3.0,
    starScale: 200.0,
    starSparsity: 34.0,
    starSpeed: 0.004,
  }



  /**
    Initializes the shader by setting the correct file paths for the vertex and fragment shaders before calling the parent initialize method.
   * @override
   * @returns {Promise<void>}
   */
  public override initialize(): Promise<boolean> {
    this.fragUri = ShaderSources.frag.skybox;
    this.vertexUri = ShaderSources.vertex.skybox;
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
    this.setVec3(ShaderUniformsEnum.U_SUN_DIRECTION, this.sun.sunDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_SUN_COLOR, this.sun.sunColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_SUN_SIZE, this.sun.sunSize);
    this.setFloat(ShaderUniformsEnum.U_SUN_FALLOFF, this.sun.sunFalloff);
    this.setInt(ShaderUniformsEnum.U_USE_SUN, this.sun.useSun ? 1 : 0);

    this.setVec3(ShaderUniformsEnum.U_MOON_DIRECTION, this.moon.moonDirection.vector);
    this.setVec4(ShaderUniformsEnum.U_MOON_COLOR, this.moon.moonColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_MOON_SIZE, this.moon.moonSize);
    this.setFloat(ShaderUniformsEnum.U_MOON_FALLOFF, this.moon.moonFalloff);
    this.setFloat(ShaderUniformsEnum.U_MOON_PHASE, this.moon.moonPhase);
    this.setFloat(ShaderUniformsEnum.U_MOON_EARTHSHINE, this.moon.moonEarthshine);
    this.setFloat(ShaderUniformsEnum.U_MOON_TERMINATOR_SOFTNESS, this.moon.moonTerminatorSoftness);
    this.setInt(ShaderUniformsEnum.U_MOON_ENABLE_ROTATION, this.moon.moonEnableRotation);
    this.setFloat(ShaderUniformsEnum.U_MOON_ROTATION_SPEED, this.moon.moonRotationSpeed);
    this.setInt(ShaderUniformsEnum.U_USE_MOON, this.moon.useMoon ? 1 : 0);
    
    this.setVec4(ShaderUniformsEnum.U_SKY_COLOR, this.material.color.toVec4());
    this.setVec4(ShaderUniformsEnum.U_HORIZON_COLOR, this.material.horizonColor.toVec4());
    this.setVec4(ShaderUniformsEnum.U_GROUND_COLOR, this.material.groundColor.toVec4());
    this.setFloat(ShaderUniformsEnum.U_EXPONENT, this.material.exponent);
    
    this.setInt(ShaderUniformsEnum.U_CLOUD_REPETITION, this.clouds.cloudRepetition);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SPEED, this.clouds.cloudSpeed);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_TILING, this.clouds.cloudTiling);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SEED, this.clouds.cloudSeed);
    this.setInt(ShaderUniformsEnum.U_USE_CLOUDS, this.clouds.useClouds ? 1 : 0);
    this.setFloat(ShaderUniformsEnum.U_WHEATHER_CONDITION, this.clouds.wheatherCondition);
    this.setFloat(ShaderUniformsEnum.U_CLOUD_SPARSITY, this.clouds.cloudSparsity);

    this.setInt(ShaderUniformsEnum.U_USE_STARS, this.stars.useStars ? 1 : 0);
    this.setFloat(ShaderUniformsEnum.U_STAR_INTENSITY, this.stars.starIntensity);
    this.setFloat(ShaderUniformsEnum.U_STAR_SCALE, this.stars.starScale);
    this.setFloat(ShaderUniformsEnum.U_STAR_SPARSITY, this.stars.starSparsity);
    this.setFloat(ShaderUniformsEnum.U_STAR_SPEED, this.stars.starSpeed);
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
