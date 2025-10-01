import { mat4, vec3 } from "gl-matrix";
import { RendererBehaviour, GLPrimitiveType, EntityType, Camera, Transform, ShaderUniformsEnum, LitMaterial, LitShader, Light, DirectionalLight, PointLight, SpotLight, Texture } from "omega-game-engine";

/**
 * A renderer for mesh-based objects that supports normal maps, lighting, and shadow mapping.
 * This class extends the base RendererBehaviour to provide more advanced rendering features.
 * It handles the setup of shader uniforms and attributes related to lighting and normal mapping,
 * and it can render shadows by using a shadow map texture.
 * @augments {RendererBehaviour}
 */
export class TexturedRendererBehaviour extends RendererBehaviour {

  /**
    Creates a new instance of the TexturedRendererBehaviour.
   * @override

   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {TexturedRendererBehaviour}
   */
  static override instanciate(gl: WebGL2RenderingContext): TexturedRendererBehaviour {
    return new TexturedRendererBehaviour(gl);
  }
  protected override _className = "TexturedRendererBehaviour"

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
    return this.parent.scene.shadowMap;
  };

  /**
    Creates an instance of TexturedRendererBehaviour.
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

    const textureUnit = 2;
    if (this.shadowMapTexture && this.shadowMapTexture.glTexture) {
      // Get the Light entity (assuming there is only one directional light for shadows)
      const lightEntity = this.parent.scene.lights.find(obj => obj.entityType === EntityType.LIGHT_DIRECTIONAL);

      if (lightEntity) {
        let { lightMvpMatrix } = this.createLightMatrices(Camera.mainCamera.transform, lightEntity.transform);
        // We need to apply the object's model matrix to the light MVP for shadow receiving.
        mat4.multiply(lightMvpMatrix, lightMvpMatrix, this.transform.modelMatrix);
        this.shader.setMat4('u_lightMVPMatrix', lightMvpMatrix);
        this.shader.setVec2('u_shadowMapSize', [this.shadowMapTexture.width, this.shadowMapTexture.height]);
        this.shader.setTexture('u_shadowMap', this.shadowMapTexture, textureUnit);
      }
    }

    // Set up lights and normal maps
    this.getNormalMapLocations();
    this.setNormalMapsInformation();
    this.setLightInformation();
    this.setShaderVariables();
    super.draw();
  }


  /**
   * Calculates the view, projection, and model-view-projection matrices for a light source.
   * These matrices are used in shadow mapping to render the scene from the light's perspective.
   *
   * @param {Transform} cameraTransform - The transform of the main camera.
   * @param {Transform} lightTransform - The transform of the light source.
   * @param {number} [frustumSize=60.0] - The size of the orthographic frustum used for the light's projection.
   * @param {number} [near=0.1] - The near clipping plane of the light's frustum.
   * @param {number} [far=200.0] - The far clipping plane of the light's frustum.
   * @returns {{ lightViewMatrix: mat4, lightProjectionMatrix: mat4, lightMvpMatrix: mat4 }} An object containing the calculated matrices.
   */
  public createLightMatrices(
    cameraTransform: Transform,
    lightTransform: Transform,
    frustumSize: number = 60.0,
    near: number = 0.1,
    far: number = 200.0,
  ) {
    // 1. Get the light's direction from the new 'lightTransform' parameter.
    const lightDirection = vec3.normalize(vec3.create(), lightTransform.forward);

    // 2. Determine the center of the light's view frustum.
    // It is centered on the camera's position for consistent shadow coverage.
    const frustumCenter = vec3.create();
    vec3.copy(frustumCenter, cameraTransform.worldPosition);

    // 3. Create the light's eye position by offsetting it from the frustum center.
    const lightPosition = vec3.create();
    vec3.scaleAndAdd(lightPosition, frustumCenter, lightDirection, -(frustumSize));

    // 4. Calculate the light's view matrix using mat4.lookAt.
    // To prevent the matrix from becoming unstable when the light is directly
    // above or below, we calculate a stable 'up' vector.
    let up = vec3.fromValues(0, 1, 0);
    if (Math.abs(vec3.dot(lightDirection, up)) > 0.999) {
      // If light direction is too close to the world up vector, use a different axis.
      up = vec3.fromValues(0, 0, 1);
    }
    const lightRight = vec3.cross(vec3.create(), lightDirection, up);
    const lightUp = vec3.cross(vec3.create(), lightRight, lightDirection);

    const lightViewMatrix = mat4.create(); // Variable declared here
    mat4.lookAt(
      lightViewMatrix,
      lightPosition,
      frustumCenter,
      lightUp
    );

    // 5. Calculate the light's projection matrix.
    const lightProjectionMatrix = mat4.create(); // Variable declared here
    mat4.ortho(
      lightProjectionMatrix,
      -frustumSize,
      frustumSize,
      -frustumSize,
      frustumSize,
      near,
      far
    );

    // 6. Calculate the final combined Light MVP Matrix.
    const lightMvpMatrix = mat4.create(); // Variable declared here
    mat4.multiply(lightMvpMatrix, lightProjectionMatrix, lightViewMatrix);

    // 7. Return all the necessary matrices in an object.
    return {
      lightViewMatrix,
      lightProjectionMatrix,
      lightMvpMatrix
    };
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
    super.setShaderVariables();
  }

  /**
    Retrieves the uniform and attribute locations related to normal maps.
   * @protected
   */
  protected getNormalMapLocations(): void {
    if (this.shader?._shaderProgram) {
      this._normalMapUniformLocation = this._gl.getUniformLocation(this.shader._shaderProgram, ShaderUniformsEnum.U_NORMAL_MAP);
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

    const material = this.shader.material as LitMaterial;
    if (material.normalTex && material.normalTex.glTexture && this._normalMapUniformLocation) {
      this._gl.activeTexture(this._gl.TEXTURE1);
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
      const normalizedDir = vec3.normalize(vec3.create(), light.direction);
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
