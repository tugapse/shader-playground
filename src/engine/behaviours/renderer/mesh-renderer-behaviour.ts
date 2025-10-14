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
 * It handles the setup of shader uniforms and attributes related to lighting and normal mapping,
 * and it can render shadows by using a shadow map texture.
 * @augments {RendererBehaviour}
 */
export class MeshRendererBehaviour extends RendererBehaviour {

  /**
    Creates a new instance of the MeshRendererBehaviour.
   * @override

   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {MeshRendererBehaviour}
   */
  static override instanciate(gl: WebGL2RenderingContext): MeshRendererBehaviour {
    return new MeshRendererBehaviour(gl);
  }
  protected override _className = "MeshRendererBehaviour"

  /**
    The uniform location for the normal map texture.
   * @protected
   * @type {WebGLUniformLocation | null}
   */
  protected _normalMapUniformLocation: WebGLUniformLocation | null = null;
  /**
    The attribute location for the tangent vector.
   * @protected
   * @type {GLint}
   */
  protected _tangentAttributeLocation: GLint = -1;
  /**
    The attribute location for the bitangent vector.
   * @protected
   * @type {GLint}
   */
  protected _bitangentAttributeLocation: GLint = -1;

  /**
    A flag to enable or disable lighting calculations.
   * @type {boolean}
   */
  public enableLights = true;

  /**
   * Gets the shadow map texture from the parent scene.
   * @returns {Texture | null} The shadow map texture, or null if not available.
   */
  public get shadowMapTexture() {
    return this.parent.scene.shadowmapRenderer?.shadowmapTexture;
  };

  public get fog(){ return this.parent.scene["fog"] as SceneFog;}
  /**
    Creates an instance of MeshRendererBehaviour.
   * @param {WebGL2RenderingContext} _gl - The WebGL2 rendering context.
   */
  constructor(public override _gl: WebGL2RenderingContext) {
    super(_gl);
    this.drawPrimitiveType = GLPrimitiveType.TRIANGLES;
  }

  /**
    Draws the mesh to the canvas.
   * @override
   */
  override draw(): void {
    if (!this.mesh || !this.shader?._shaderProgram) {
      return;
    }
    this.shader.use();


    if (this.shader instanceof LitShader) {

      this.shader.setInt(ShaderUniformsEnum.U_USE_SHADOWS, 0);
      if (this.shadowMapTexture && this.shadowMapTexture.glTexture) {
        // Get the Light entity (assuming there is only one directional light for shadows)
        const lightEntity = this.parent.scene.lights.find(obj => obj.entityType === EntityType.LIGHT_DIRECTIONAL && obj.active &&obj.show);
        this.shader.setTexture(ShaderUniformsEnum.U_SHADOW_MAP, this.shadowMapTexture, 2);
        this.shader.setVec2(ShaderUniformsEnum.U_SHADOW_MAP_SIZE, [this.shadowMapTexture.width, this.shadowMapTexture.height]);
        this.shadowMapTexture.bind();

        if (lightEntity) {
          let { lightMvpMatrix } = this.createLightMatrices(Camera.mainCamera.transform, lightEntity.transform);
          mat4.multiply(lightMvpMatrix, lightMvpMatrix, this.transform.modelMatrix);
          this.shader.setMat4(ShaderUniformsEnum.U_LIGHT_MVP_MATRIX, lightMvpMatrix);
          this.shader.setInt(ShaderUniformsEnum.U_USE_SHADOWS, 1);
        }
      }


      // Set up lights and normal maps
      this.setShaderVariables();
    }

    // Set the View Matrix (required for v_fogDistance calculation in vertex shader)
    const viewMatrix = Camera.mainCamera.viewMatrix;
    this.shader.setMat4(ShaderUniformsEnum.U_VIEW_MATRIX, viewMatrix);

    // Pass the fog uniform values
    this.shader.setInt(ShaderUniformsEnum.U_FOG_ENABLED, this.fog.enabled ? 1 : 0);
    if(this.fog.enabled){
      this.shader.setVec3(ShaderUniformsEnum.U_FOG_COLOR, this.fog.color.toVec3());
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_DENSITY, this.fog.density);
      this.shader.setFloat(ShaderUniformsEnum.U_FOG_DISTANCE, this.fog.distance);
    }
    super.setShaderVariables();
    super.draw();
    this.shadowMapTexture?.unBind();
  }



  /**
    Initializes the shader and its buffers for the mesh, including normal, tangent, and bitangent data.
   * @protected
   * @override
   */
  protected override initializeShader(): void {
    super.initializeShader();
    if (!this.shader) return;
    this.shader.buffers.normal = this._gl.createBuffer();
    this.shader.buffers.tangent = this._gl.createBuffer();
    this.shader.buffers.bitangent = this._gl.createBuffer();
    this.shader.initBuffers(this._gl, this.mesh.meshData);
  }

  /**
    Sets the shader variables for lighting and normal maps before drawing.
   * @protected
   * @override
   */
  protected override setShaderVariables(): void {
    this.setLightInformation();
    this.setNormalMapsInformation();
  }

  /**
    Retrieves the uniform and attribute locations related to normal maps.
   * @protected
   */
  protected getNormalMapLocations(): void {
    if (this.shader?._shaderProgram) {
      this._normalMapUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_NORMAL_TEX);
      this._worldMatrixUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_WORLD_MATRIX);
      this._worldInverseTransposeMatrixUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_WORLD_INVERSE_TRANSPOSE_MATRIX);
      this._tangentAttributeLocation = this._gl.getAttribLocation(this.shader._shaderProgram, ShaderUniformsEnum.A_TANGENT);
      this._bitangentAttributeLocation = this._gl.getAttribLocation(this.shader._shaderProgram, ShaderUniformsEnum.A_BITANGENT);
    }
  }

  /**
    Binds the normal map texture to a texture unit and sets the corresponding uniform.
   * @protected
   */
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

  /**
    Gathers and sets lighting information in the shader.
   * @protected
   */
  protected setLightInformation(): void {
    if (this.shader instanceof LitShader && this.enableLights) {
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

  /**
    Separates lights into their respective types and loads their data into the shader.
   * @protected
   * @param {Light[]} sceneLights - An array of all lights in the scene.
   */
  protected createLightObjectInfo(sceneLights: Light[]): void {
    if (this.enableLights === false) return;
    const directionalLights: DirectionalLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_DIRECTIONAL) as DirectionalLight[];
    const pointLights: PointLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_POINT) as PointLight[];
    const spotLights: SpotLight[] = sceneLights.filter((e) => e.entityType === EntityType.LIGHT_SPOT) as SpotLight[];

    this.loadDirectionalLights(directionalLights);
    this.loadPointLights(pointLights);
    this.loadSpotLights(spotLights);
  }

  /**
    Loads spot light data into the shader's uniform arrays.
   * @protected
   * @param {SpotLight[]} spotLights - An array of spot lights.
   */
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

    const spotPositionsFlat: number[] = [];
    const spotDirectionsFlat: number[] = [];
    const spotColorsFlat: number[] = [];
    const spotInnerConeCosFlat: number[] = [];
    const spotOuterConeCosFlat: number[] = [];
    const spotConstAttsFlat: number[] = [];
    const spotLinearAttsFlat: number[] = [];
    const spotQuadraticAttsFlat: number[] = [];

    spotLights.forEach((light) => {
      spotPositionsFlat.push(...light.transform.worldPosition);
      const normalizedDir = vec3.normalize(vec3.create(), light.toLightDirection);
      spotDirectionsFlat.push(...normalizedDir);
      spotColorsFlat.push(...light.color.toVec3());
      spotInnerConeCosFlat.push(Math.cos(light.coneAngles.inner));
      spotOuterConeCosFlat.push(Math.cos(light.coneAngles.outer));
      spotConstAttsFlat.push(light.attenuation.constant);
      spotLinearAttsFlat.push(light.attenuation.linear);
      spotQuadraticAttsFlat.push(light.attenuation.quadratic);
    });

    if (uNumSpotLightsLoc) this._gl.uniform1i(uNumSpotLightsLoc, spotLights.length);
    if (spotLights.length > 0) {
      if (uSpotPositionsLoc) this._gl.uniform3fv(uSpotPositionsLoc, spotPositionsFlat);
      if (uSpotDirectionsLoc) this._gl.uniform3fv(uSpotDirectionsLoc, spotDirectionsFlat);
      if (uSpotColorsLoc) this._gl.uniform3fv(uSpotColorsLoc, spotColorsFlat);
      if (uSpotInnerConeCosLoc) this._gl.uniform1fv(uSpotInnerConeCosLoc, spotInnerConeCosFlat);
      if (uSpotOuterConeCosLoc) this._gl.uniform1fv(uSpotOuterConeCosLoc, spotOuterConeCosFlat);
      if (uSpotConstAttsLoc) this._gl.uniform1fv(uSpotConstAttsLoc, spotConstAttsFlat);
      if (uSpotLinearAttsLoc) this._gl.uniform1fv(uSpotLinearAttsLoc, spotLinearAttsFlat);
      if (uSpotQuadraticAttsLoc) this._gl.uniform1fv(uSpotQuadraticAttsLoc, spotQuadraticAttsFlat);
    }
  }

  /**
    Loads directional light data into the shader's uniform arrays.
   * @protected
   * @param {DirectionalLight[]} directionalLights - An array of directional lights.
   */
  protected loadDirectionalLights(directionalLights: DirectionalLight[]): void {
    if (!this.shader) return;

    const uNumDirLightsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_numDirectionalLights");
    const uDirDirectionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_directionalLightDirections[0]");
    const uDirColorsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_directionalLightColors[0]");

    const dirDirectionsFlat: number[] = [];
    const dirColorsFlat: number[] = [];

    directionalLights.forEach((light) => {
      const normalizedDir = vec3.normalize(vec3.create(), light.direction);
      dirDirectionsFlat.push(...normalizedDir);
      dirColorsFlat.push(...light.color.toVec3());
    });

    if (uNumDirLightsLoc) this._gl.uniform1i(uNumDirLightsLoc, directionalLights.length);
    if (directionalLights.length > 0) {
      if (uDirDirectionsLoc) this._gl.uniform3fv(uDirDirectionsLoc, dirDirectionsFlat);
      if (uDirColorsLoc) this._gl.uniform3fv(uDirColorsLoc, dirColorsFlat);
    }
  }

  /**
    Loads point light data into the shader's uniform arrays.
   * @protected
   * @param {PointLight[]} pointLights - An array of point lights.
   */
  protected loadPointLights(pointLights: PointLight[]): void {
    if (!this.shader) return;

    const uNumPointLightsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_numPointLights");
    const uPointPositionsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightPositions[0]");
    const uPointColorsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightColors[0]");
    const uPointConstAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightConstantAtts[0]");
    const uPointLinearAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightLinearAtts[0]");
    const uPointQuadraticAttsLoc = this._gl.getUniformLocation(this.shader._shaderProgram!, "u_pointLightQuadraticAtts[0]");

    const pointPositionsFlat: number[] = [];
    const pointColorsFlat: number[] = [];
    const pointConstAttsFlat: number[] = [];
    const pointLinearAttsFlat: number[] = [];
    const pointQuadraticAttsFlat: number[] = [];

    pointLights.forEach((light) => {
      pointPositionsFlat.push(...light.transform.worldPosition);
      pointColorsFlat.push(...light.color.toVec3());
      pointConstAttsFlat.push(light.attenuation.constant);
      pointLinearAttsFlat.push(light.attenuation.linear);
      pointQuadraticAttsFlat.push(light.attenuation.quadratic);
    });

    if (uNumPointLightsLoc) this._gl.uniform1i(uNumPointLightsLoc, pointLights.length);
    if (pointLights.length > 0) {
      if (uPointPositionsLoc) this._gl.uniform3fv(uPointPositionsLoc, pointPositionsFlat);
      if (uPointColorsLoc) this._gl.uniform3fv(uPointColorsLoc, pointColorsFlat);
      if (uPointConstAttsLoc) this._gl.uniform1fv(uPointConstAttsLoc, pointConstAttsFlat);
      if (uPointLinearAttsLoc) this._gl.uniform1fv(uPointLinearAttsLoc, pointLinearAttsFlat);
      if (uPointQuadraticAttsLoc) this._gl.uniform1fv(uPointQuadraticAttsLoc, pointQuadraticAttsFlat);
    }
  }
}
