import { JsonSerializedData, ShaderSources } from "@engine";
import { EngineCache } from "../core/engineCache";
import { Camera } from "../entities/camera";
import { ShaderUniformsEnum } from "../enums/shader-uniforms.enum";
import { LitMaterial } from "../materials/lit-material";
import { Texture } from "../textures/texture";
import { Shader } from "./shader";

export class LitShader extends Shader {

  protected override _className = "LitShader"

  protected _emissiveMapUniformLocation: WebGLUniformLocation | null = null;
  protected _tangentAttributeLocation: GLint = -1;
  protected _bitangentAttributeLocation: GLint = -1;

  // Add this property to cache our generated 1x1 textures
  private _defaultTextures: { [key: string]: WebGLTexture } = {};

  public static override instanciate(gl: WebGL2RenderingContext, material: LitMaterial): LitShader {
    return new LitShader(gl, material);
  }

  constructor(override gl: WebGL2RenderingContext, override material: LitMaterial) {
    super(
      gl,
      material,
      ShaderSources.frag.default_lit,
      ShaderSources.vertex.default
    );
  }

  public override loadDataIntoShader(): void {
    if (!this.material) return;

    this.checkAndLoadTextures();
    
    super.loadDataIntoShader();
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, this.material.color.toVec4());
    this.setVec2(ShaderUniformsEnum.U_UV_SCALE, this.material.uvScale.vector);
    this.setVec2(ShaderUniformsEnum.U_UV_OFFSET, this.material.uvOffset.vector);

    this.setFloat(ShaderUniformsEnum.U_SPECULAR_STRENGTH, this.material.specularStrength);
    this.setFloat(ShaderUniformsEnum.U_ROUGHNESS, Math.max(this.material.roughness, 0.01));
    this.setFloat(ShaderUniformsEnum.U_NORMAL_MAP_STRENGTH, this.material.normalMapStrength);

    this.setVec3(ShaderUniformsEnum.U_CAMERA_POSITION, Camera.mainCamera.transform.worldPosition);
  }

  protected async checkAndLoadTextures(): Promise<void> {
    const bindMap = async (
      tex: Texture | undefined | null,
      uniformName: string | ShaderUniformsEnum,
      unit: number,
      defaultGetter: (gl: WebGL2RenderingContext) => Promise<Texture> | Texture
    ) => {
      let activeTex = tex;

      if (!activeTex || !activeTex.isImageLoaded) {
        if (activeTex && !activeTex.isImageLoaded) {
          activeTex.setGL(this.gl);
          activeTex.load(); // Start loading, but use fallback for this frame
        }
        activeTex = await defaultGetter(this.gl);
      }

      // Explicitly secure the WebGL state to prevent texture unit collisions
      if (this._shaderProgram && activeTex) {
        const location = this.gl.getUniformLocation(this._shaderProgram, uniformName as string);
        if (location !== null) {
          this.gl.activeTexture(this.gl.TEXTURE0 + unit);
          
          if ((activeTex as any).glTexture) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, (activeTex as any).glTexture);
          } else {
            activeTex.bind(); 
          }
          
          this.gl.uniform1i(location, unit);
        }
      }
      return activeTex;
    };
    
    this.material.mainTex = await bindMap(this.material.mainTex, ShaderUniformsEnum.U_MAIN_TEX, 0, EngineCache.getWhiteTexture);
    this.material.normalTex = await bindMap(this.material.normalTex, ShaderUniformsEnum.U_NORMAL_TEX, 1, EngineCache.getNormalTexture);
    this.material.specularTex = await bindMap(this.material.specularTex, "u_specularMap", 3, EngineCache.getWhiteTexture);
    this.material.roughnessTex = await bindMap(this.material.roughnessTex, "u_roughnessMap", 4, EngineCache.getWhiteTexture);
    this.material.aoTex = await bindMap(this.material.aoTex, "u_aoMap", 5, EngineCache.getWhiteTexture);
    this.material.emissiveTex = await bindMap(this.material.emissiveTex, "u_emissiveMap", 6, EngineCache.getBlackTexture);
  }

  override release(): void {
    super.release();
    if (this.material.mainTex) this.material.mainTex.unBind();
    if (this.material.normalTex) this.material.normalTex.unBind();
    if (this.material.specularTex) this.material.specularTex.unBind();
    if (this.material.roughnessTex) this.material.roughnessTex.unBind();
    if (this.material.aoTex) this.material.aoTex.unBind();
    if (this.material.emissiveTex) this.material.emissiveTex.unBind();
  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      mainTex: this.material.mainTex?.toJsonObject(),
      normalTex: this.material.normalTex?.toJsonObject(),
      specularTex: this.material.specularTex?.toJsonObject(),
      roughnessTex: this.material.roughnessTex?.toJsonObject(),
      aoTex: this.material.aoTex?.toJsonObject(),
      emissiveTex: this.material.emissiveTex?.toJsonObject(),
    }
  }

  override async fromJson(jsonObject: JsonSerializedData): Promise<void> {
    await super.fromJson(jsonObject);
    this.material.fromJson(jsonObject['material']);
  }

  public override destroy(): void {
    super.destroy();
    if (this.material.mainTex) this.material.mainTex.destroy();
    if (this.material.normalTex) this.material.normalTex.destroy(); 
    if (this.material.specularTex) this.material.specularTex.destroy();
    if (this.material.roughnessTex) this.material.roughnessTex.destroy();
    if (this.material.aoTex) this.material.aoTex.destroy();
    if (this.material.emissiveTex) this.material.emissiveTex.destroy();
  }
}