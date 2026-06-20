import { mat4, vec3 } from "gl-matrix";
import { EngineCache, SceneFog } from "../../core";
import { Camera, DirectionalLight, Light, PointLight, SpotLight } from "../../entities";
import { EntityType, GLPrimitiveType, ShaderUniformsEnum } from "../../enums";
import { LitMaterial } from "../../materials";
import { LitShader } from "../../shaders";
import { RendererBehaviour } from "./renderer-behaviour";

/**
 * A renderer for mesh-based objects that supports normal maps, lighting, and shadow mapping.
 * This class extends the base RendererBehaviour to provide more advanced rendering features.
 */
export class MeshRendererBehaviour extends RendererBehaviour {

  static override instanciate(gl: WebGL2RenderingContext): MeshRendererBehaviour {
    return new MeshRendererBehaviour(gl);
  }
  protected override _className = "MeshRendererBehaviour";

  // --- PER-OBJECT PERMANENT BUFFERS TO ELIMINATE GC CHURN ---
  private static readonly MAX_LIGHT_PASS = 16;
  private readonly _vec3Scratch = vec3.create();
  private readonly _mvpScratch = mat4.create();

  private readonly _spotPositionsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _spotDirectionsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _spotColorsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _spotInnerConeBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _spotOuterConeBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _spotConstAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _spotLinearAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _spotQuadraticAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);

  private readonly _dirDirectionsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _dirColorsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);

  private readonly _pointPositionsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _pointColorsBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS * 3);
  private readonly _pointConstAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _pointLinearAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);
  private readonly _pointQuadraticAttBuf = new Float32Array(MeshRendererBehaviour.MAX_LIGHT_PASS);

  protected _normalMapUniformLocation: WebGLUniformLocation | null = null;
  protected _tangentAttributeLocation: GLint = -1;
  protected _bitangentAttributeLocation: GLint = -1;

  public receiveShadows = true;

  public get shadowMapTexture() {
    return this.parent.scene.shadowmapRenderer?.shadowmapTexture;
  }

  public get fog() { return this.parent.scene["sceneFog"] as SceneFog; }

  constructor(public override _gl: WebGL2RenderingContext) {
    super(_gl);
    this.drawPrimitiveType = GLPrimitiveType.TRIANGLES;
  }

  override draw(): void {
    if (!this.mesh || !this.shader?._shaderProgram) {
      return;
    }
    this.shader.use();

    if (this.shader instanceof LitShader) {
      this.shader.setInt(ShaderUniformsEnum.U_USE_SHADOWS, 0);
      if (this.shadowMapTexture && this.shadowMapTexture.glTexture) {
        const lightEntity = this.parent.scene.lights.find(obj => obj.entityType === EntityType.LIGHT_DIRECTIONAL && obj.active && obj.show);
        this.shader.setTexture(ShaderUniformsEnum.U_SHADOW_MAP, this.shadowMapTexture, 2);
        this.shader.setVec2(ShaderUniformsEnum.U_SHADOW_MAP_SIZE, [this.shadowMapTexture.width, this.shadowMapTexture.height]);
        this.shadowMapTexture.bind();

        if (lightEntity) {
          let { lightMvpMatrix } = this.createLightMatrices(Camera.mainCamera.transform, lightEntity as Light);
          mat4.multiply(this._mvpScratch, lightMvpMatrix, this.transform.modelMatrix);
          this.shader.setMat4(ShaderUniformsEnum.U_LIGHT_MVP_MATRIX, this._mvpScratch);
          this.receiveShadows && this.shader.setInt(ShaderUniformsEnum.U_USE_SHADOWS, 1);
        }
      }

      this.setShaderVariables();
    }

    const viewMatrix = Camera.mainCamera.viewMatrix;
    this.shader.setMat4(ShaderUniformsEnum.U_VIEW_MATRIX, viewMatrix);

    this.shader.setInt(ShaderUniformsEnum.U_FOG_ENABLED, this.fog.enabled ? 1 : 0);
    if (this.fog.enabled) {
      this.shader.setVec3(ShaderUniformsEnum.U_FOG_COLOR, this.fog.color.toVec3());
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_DENSITY, this.fog.density);
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_DISTANCE, this.fog.distance);
      this.shader.setInt(ShaderUniformsEnum.U_FOG_TYPE, this.fog.fogType);
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_HEIGHT_FALLOFF, this.fog.heightFalloff);
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_BASE_HEIGHT, this.fog.baseHeight);
    }
    
    super.setShaderVariables();
    super.draw();
    this.shadowMapTexture?.unBind();
  }

  protected override initializeShader(): void {
    super.initializeShader();
    if (!this.shader) return;
    this.shader.buffers.normal = this._gl.createBuffer();
    this.shader.buffers.tangent = this._gl.createBuffer();
    this.shader.buffers.bitangent = this._gl.createBuffer();
    this.shader.initBuffers(this._gl, this.mesh.meshData);
  }

  protected override setShaderVariables(): void {
    this.shader!.setFloat(ShaderUniformsEnum.U_SHADOW_STRENGTH, this.parent.scene.shadowmapRenderer.shadowstrength.value);
    this.setLightInformation();
    this.setNormalMapsInformation();
  }

  protected getNormalMapLocations(): void {
    if (this.shader?._shaderProgram) {
      this._normalMapUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_NORMAL_TEX);
      this._worldMatrixUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_WORLD_MATRIX);
      this._worldInverseTransposeMatrixUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_WORLD_INVERSE_TRANSPOSE_MATRIX);
      this._tangentAttributeLocation = this._gl.getAttribLocation(this.shader._shaderProgram, ShaderUniformsEnum.A_TANGENT);
      this._bitangentAttributeLocation = this._gl.getAttribLocation(this.shader._shaderProgram, ShaderUniformsEnum.A_BITANGENT);
    }
  }

  protected setNormalMapsInformation(): void {
    if (!this.shader) return;
    this.getNormalMapLocations();

    const material = this.shader.material as LitMaterial;
    if (material.normalTex && material.normalTex.glTexture && this._normalMapUniformLocation) {
      this._gl.activeTexture(this._gl.TEXTURE0 + 1);
      this._gl.bindTexture(this._gl.TEXTURE_2D, material.normalTex.glTexture);
      this._gl.uniform1i(this._normalMapUniformLocation, 1);
    }
  }

  protected setLightInformation(): void {
    if (this.shader instanceof LitShader) {
      const lights = this.parent.scene.lights.filter((light) => light.active && light.show);
      const ambientLight = lights.find((l) => l.entityType === EntityType.LIGHT_AMBIENT);

      if (ambientLight) {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, ambientLight.color.toVec4());
      } else {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, [0.1, 0.1, 0.1, 1]);
      }

      this.createLightObjectInfo(lights);
    }
  }

  protected createLightObjectInfo(sceneLights: Light[]): void {
    const directionalLights: DirectionalLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_DIRECTIONAL) as DirectionalLight[];
    const pointLights: PointLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_POINT) as PointLight[];
    const spotLights: SpotLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_SPOT) as SpotLight[];

    this.loadDirectionalLights(directionalLights);
    this.loadPointLights(pointLights);
    this.loadSpotLights(spotLights);
  }

  protected loadSpotLights(spotLights: SpotLight[]): void {
    if (!this.shader) return;

    const uNumSpotLightsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_numSpotLights");
    const uSpotPositionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightPositions[0]");
    const uSpotDirectionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightDirections[0]");
    const uSpotColorsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightColors[0]");
    const uSpotInnerConeCosLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightInnerConeCos[0]");
    const uSpotOuterConeCosLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightOuterConeCos[0]");
    const uSpotConstAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightConstantAtts[0]");
    const uSpotLinearAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightLinearAtts[0]");
    const uSpotQuadraticAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_spotLightQuadraticAtts[0]");

    const count = Math.min(spotLights.length, MeshRendererBehaviour.MAX_LIGHT_PASS);

    for (let i = 0; i < count; i++) {
      const light = spotLights[i];
      this._spotPositionsBuf.set(light.transform.worldPosition, i * 3);
      
      vec3.normalize(this._vec3Scratch, light.toLightDirection);
      this._spotDirectionsBuf.set(this._vec3Scratch, i * 3);
      this._spotColorsBuf.set(light.color.toVec3(), i * 3);
      
      this._spotInnerConeBuf[i] = Math.cos(light.coneAngles.inner);
      this._spotOuterConeBuf[i] = Math.cos(light.coneAngles.outer);
      this._spotConstAttBuf[i] = light.attenuation.constant;
      this._spotLinearAttBuf[i] = light.attenuation.linear;
      this._spotQuadraticAttBuf[i] = light.attenuation.quadratic;
    }

    if (uNumSpotLightsLoc) this._gl.uniform1i(uNumSpotLightsLoc, count);
    if (count > 0) {
      if (uSpotPositionsLoc) this._gl.uniform3fv(uSpotPositionsLoc, this._spotPositionsBuf.subarray(0, count * 3));
      if (uSpotDirectionsLoc) this._gl.uniform3fv(uSpotDirectionsLoc, this._spotDirectionsBuf.subarray(0, count * 3));
      if (uSpotColorsLoc) this._gl.uniform3fv(uSpotColorsLoc, this._spotColorsBuf.subarray(0, count * 3));
      if (uSpotInnerConeCosLoc) this._gl.uniform1fv(uSpotInnerConeCosLoc, this._spotInnerConeBuf.subarray(0, count));
      if (uSpotOuterConeCosLoc) this._gl.uniform1fv(uSpotOuterConeCosLoc, this._spotOuterConeBuf.subarray(0, count));
      if (uSpotConstAttsLoc) this._gl.uniform1fv(uSpotConstAttsLoc, this._spotConstAttBuf.subarray(0, count));
      if (uSpotLinearAttsLoc) this._gl.uniform1fv(uSpotLinearAttsLoc, this._spotLinearAttBuf.subarray(0, count));
      if (uSpotQuadraticAttsLoc) this._gl.uniform1fv(uSpotQuadraticAttsLoc, this._spotQuadraticAttBuf.subarray(0, count));
    }
  }

  protected loadDirectionalLights(directionalLights: DirectionalLight[]): void {
    if (!this.shader) return;

    const uNumDirLightsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_numDirectionalLights");
    const uDirDirectionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_directionalLightDirections[0]");
    const uDirColorsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_directionalLightColors[0]");

    const count = Math.min(directionalLights.length, MeshRendererBehaviour.MAX_LIGHT_PASS);

    for (let i = 0; i < count; i++) {
      const light = directionalLights[i];
      vec3.normalize(this._vec3Scratch, light.direction);
      this._dirDirectionsBuf.set(this._vec3Scratch, i * 3);
      this._dirColorsBuf.set(light.color.toVec3(), i * 3);
    }

    if (uNumDirLightsLoc) this._gl.uniform1i(uNumDirLightsLoc, count);
    if (count > 0) {
      if (uDirDirectionsLoc) this._gl.uniform3fv(uDirDirectionsLoc, this._dirDirectionsBuf.subarray(0, count * 3));
      if (uDirColorsLoc) this._gl.uniform3fv(uDirColorsLoc, this._dirColorsBuf.subarray(0, count * 3));
    }
  }

  protected loadPointLights(pointLights: PointLight[]): void {
    if (!this.shader) return;

    const uNumPointLightsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_numPointLights");
    const uPointPositionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightPositions[0]");
    const uPointColorsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightColors[0]");
    const uPointConstAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightConstantAtts[0]");
    const uPointLinearAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightLinearAtts[0]");
    const uPointQuadraticAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightQuadraticAtts[0]");

    const count = Math.min(pointLights.length, MeshRendererBehaviour.MAX_LIGHT_PASS);

    for (let i = 0; i < count; i++) {
      const light = pointLights[i];
      this._pointPositionsBuf.set(light.transform.worldPosition, i * 3);
      this._pointColorsBuf.set(light.color.toVec3(), i * 3);
      this._pointConstAttBuf[i] = light.attenuation.constant;
      this._pointLinearAttBuf[i] = light.attenuation.linear;
      this._pointQuadraticAttBuf[i] = light.attenuation.quadratic;
    }

    if (uNumPointLightsLoc) this._gl.uniform1i(uNumPointLightsLoc, count);
    if (count > 0) {
      if (uPointPositionsLoc) this._gl.uniform3fv(uPointPositionsLoc, this._pointPositionsBuf.subarray(0, count * 3));
      if (uPointColorsLoc) this._gl.uniform3fv(uPointColorsLoc, this._pointColorsBuf.subarray(0, count * 3));
      if (uPointConstAttsLoc) this._gl.uniform1fv(uPointConstAttsLoc, this._pointConstAttBuf.subarray(0, count));
      if (uPointLinearAttsLoc) this._gl.uniform1fv(uPointLinearAttsLoc, this._pointLinearAttBuf.subarray(0, count));
      if (uPointQuadraticAttsLoc) this._gl.uniform1fv(uPointQuadraticAttsLoc, this._pointQuadraticAttBuf.subarray(0, count));
    }
  }
}