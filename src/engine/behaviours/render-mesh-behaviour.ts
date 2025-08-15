import { Mesh } from "@engine/core/mesh";
import { DirectionalLight, Light, LightType, PointLight, SpotLight } from "@engine/entities/light"; // Assuming correct path and types
import { LitMaterial } from "@engine/materials/lit-material";
import { LitShader } from "@engine/shaders/lit-shader"; // Assuming correct path
import { mat3, mat4, vec3 } from "gl-matrix"; // Added mat3 import
import { CanvasViewport } from "../core/canvas-viewport";
import { Camera } from "../entities/camera";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { ColorMaterial } from "../materials/color-material";
import { Shader } from "../shaders/shader";
import { EntityBehaviour } from "./entity-behaviour";

export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!: Mesh;
  public material!: ColorMaterial; // Assuming this also handles mainTex
  public shader!: Shader;

  protected time = 0;
  // New: Store uniform and attribute locations for efficiency
  protected normalMapUniformLocation: WebGLUniformLocation | null = null;
  protected worldMatrixUniformLocation: WebGLUniformLocation | null = null;
  protected worldInverseTransposeMatrixUniformLocation: WebGLUniformLocation | null = null;
  protected tangentAttributeLocation: GLint = -1;
  protected bitangentAttributeLocation: GLint = -1;

  constructor( protected gl: WebGLRenderingContext) {
    super()
  }

  override initialize(): void {
    this.initializeGlSettings();
    this.initializeShader();
  }

  override update(ellapsed: number): void {
    this.time += ellapsed;
  }

  override draw(): void {
    if (!this.mesh || !this.shader.shaderProgram) { return }
    this.getNormalMapLocations();
    this.shader.bindBuffers();
    this.shader.use();
    this.setShaderVariables();
    this.gl.drawElements(this.gl.TRIANGLES, this.mesh.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  protected initializeGlSettings() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
  }

  protected initializeShader() {
    this.shader.initialize();

    this.shader.buffers.position = this.gl.createBuffer();
    this.shader.buffers.normal = this.gl.createBuffer();
    this.shader.buffers.uv = this.gl.createBuffer();
    this.shader.buffers.indices = this.gl.createBuffer();
    this.shader.buffers.tangent = this.gl.createBuffer();
    this.shader.buffers.bitangent = this.gl.createBuffer();

    this.shader.initBuffers(this.gl, this.mesh.meshData);

  }


  protected getNormalMapLocations() {
    if (this.shader.shaderProgram) {
      this.normalMapUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, 'u_normalMap');
      this.worldMatrixUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, 'u_worldMatrix');
      this.worldInverseTransposeMatrixUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, 'u_worldInverseTransposeMatrix');
      this.tangentAttributeLocation = this.gl.getAttribLocation(this.shader.shaderProgram, 'a_tangent');
      this.bitangentAttributeLocation = this.gl.getAttribLocation(this.shader.shaderProgram, 'a_bitangent');
    }
  }

  protected setShaderVariables() {
    this.setCameraMatrices();
    this.setModelMatrices(); // Call setModelMatrices to set world and inverse transpose matrices
    this.setLightInformation();
    this.setNormalMapsInformation(); // This method now handles normal map texture and attributes
    this.shader.setfloat(ShaderUniformsEnum.U_TIME, this.time);
    this.shader.setVec2(ShaderUniformsEnum.U_SCREEN_RESOLUTION, [CanvasViewport.rendererWidth, CanvasViewport.rendererHeight]);

    // This method likely loads standard uniforms like u_matColor and u_mainTex
    this.shader.loadDataIntoShader();
  }

  protected setNormalMapsInformation() {
    const material  = this.material as LitMaterial;
    // If a normal map texture is provided, bind and pass it
    if (material.normalTex && material.normalTex.glTexture && this.normalMapUniformLocation) {
      this.gl.activeTexture(this.gl.TEXTURE1); // Use texture unit 1 for normal map
      this.gl.bindTexture(this.gl.TEXTURE_2D, material.normalTex.glTexture);
      this.gl.uniform1i(this.normalMapUniformLocation, 1); // Tell the shader u_normalMap is on TEXTURE1
    }
  }

  protected setCameraMatrices() {
    const camera = Camera.mainCamera;
    const mvpMatrix = mat4.create();
    this.parent.transform.updateModelMatrix();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
    this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
  }

  protected setModelMatrices() {

    if (this.worldMatrixUniformLocation) {
      this.gl.uniformMatrix4fv(this.worldMatrixUniformLocation, false, this.parent.transform.modelMatrix);
    } else {
        console.warn("u_worldMatrix uniform location not found.");
    }

    if (this.worldInverseTransposeMatrixUniformLocation) {
      const worldInverseTransposeMatrix = mat4.create(); // Start with a mat4
      mat4.invert(worldInverseTransposeMatrix, this.parent.transform.modelMatrix);
      mat4.transpose(worldInverseTransposeMatrix, worldInverseTransposeMatrix);

      // Extract the 3x3 part for the mat3 uniform
      const normalMatrixAsMat3 = mat3.create();
      mat3.fromMat4(normalMatrixAsMat3, worldInverseTransposeMatrix);

      this.gl.uniformMatrix3fv(this.worldInverseTransposeMatrixUniformLocation, false, normalMatrixAsMat3);
    } else {
        console.warn("u_worldInverseTransposeMatrix uniform location not found.");
    }
  }


  protected setLightInformation() {
    if (this.shader instanceof LitShader) {
      const lights = this.parent.scene.lights;

      const ambientLight = lights.find(l => l.lightType === LightType.AMBIENT);
      if (ambientLight) {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, ambientLight.color);
      } else {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, [0.1,0.1,0.1, 1]);
      }

      this.createLightObjectInfo(lights);
    }
  }

  protected createLightObjectInfo(sceneLights: Light[]) {
    const directionalLights: DirectionalLight[] = sceneLights.filter(e => e.lightType === LightType.DIRECTIONAL) as DirectionalLight[];
    const pointLights: PointLight[] = sceneLights.filter(e => e.lightType === LightType.POINT) as PointLight[];
    const spotLights: SpotLight[] = sceneLights.filter(e => e.lightType === LightType.SPOT) as SpotLight[];

    this.loadDirectionalLights(directionalLights);
    this.loadPointLights(pointLights);
    this.loadSpotLights(spotLights);
  }

  protected loadSpotLights(spotLights: SpotLight[]) {
    // Get uniform locations (ensuring '[0]' for array uniforms)
    const uNumSpotLightsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_numSpotLights');
    const uSpotPositionsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightPositions[0]');
    const uSpotDirectionsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightDirections[0]');
    const uSpotColorsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightColors[0]');
    const uSpotInnerConeCosLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightInnerConeCos[0]');
    const uSpotOuterConeCosLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightOuterConeCos[0]');
    const uSpotConstAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightConstantAtts[0]');
    const uSpotLinearAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightLinearAtts[0]');
    const uSpotQuadraticAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_spotLightQuadraticAtts[0]');

    const spotPositionsFlat: number[] = [];
    const spotDirectionsFlat: number[] = [];
    const spotColorsFlat: number[] = [];
    const spotInnerConeCosFlat: number[] = [];
    const spotOuterConeCosFlat: number[] = [];
    const spotConstAttsFlat: number[] = [];
    const spotLinearAttsFlat: number[] = [];
    const spotQuadraticAttsFlat: number[] = [];

    spotLights.forEach(light => {
      spotPositionsFlat.push(...light.transform.position);
      const normalizedDir = vec3.normalize(vec3.create(), light.direction);
      spotDirectionsFlat.push(...normalizedDir);
      spotColorsFlat.push(light.color[0], light.color[1], light.color[2]);
      spotInnerConeCosFlat.push(Math.cos(light.coneAngles.inner));
      spotOuterConeCosFlat.push(Math.cos(light.coneAngles.outer));
      spotConstAttsFlat.push(light.attenuation.constant);
      spotLinearAttsFlat.push(light.attenuation.linear);
      spotQuadraticAttsFlat.push(light.attenuation.quadratic);
    });

    // Only send uniforms if the location is valid
    if (uNumSpotLightsLoc) this.gl.uniform1i(uNumSpotLightsLoc, spotLights.length);
    if (spotLights.length > 0) {
      if (uSpotPositionsLoc) this.gl.uniform3fv(uSpotPositionsLoc, spotPositionsFlat);
      if (uSpotDirectionsLoc) this.gl.uniform3fv(uSpotDirectionsLoc, spotDirectionsFlat);
      if (uSpotColorsLoc) this.gl.uniform3fv(uSpotColorsLoc, spotColorsFlat);
      if (uSpotInnerConeCosLoc) this.gl.uniform1fv(uSpotInnerConeCosLoc, spotInnerConeCosFlat);
      if (uSpotOuterConeCosLoc) this.gl.uniform1fv(uSpotOuterConeCosLoc, spotOuterConeCosFlat);
      if (uSpotConstAttsLoc) this.gl.uniform1fv(uSpotConstAttsLoc, spotConstAttsFlat);
      if (uSpotLinearAttsLoc) this.gl.uniform1fv(uSpotLinearAttsLoc, spotLinearAttsFlat);
      if (uSpotQuadraticAttsLoc) this.gl.uniform1fv(uSpotQuadraticAttsLoc, spotQuadraticAttsFlat);
    }
  }

  protected loadDirectionalLights(directionalLights: DirectionalLight[]) {
    // Get uniform locations (ensuring '[0]' for array uniforms)
    const uNumDirLightsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_numDirectionalLights');
    const uDirDirectionsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_directionalLightDirections[0]');
    const uDirColorsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_directionalLightColors[0]');

    const dirDirectionsFlat: number[] = [];
    const dirColorsFlat: number[] = [];

    directionalLights.forEach(light => {
      const normalizedDir = vec3.normalize(vec3.create(), light.direction);
      dirDirectionsFlat.push(...normalizedDir);
      dirColorsFlat.push(light.color[0], light.color[1], light.color[2]);
    });

    // Only send uniforms if the location is valid
    if (uNumDirLightsLoc) this.gl.uniform1i(uNumDirLightsLoc, directionalLights.length);
    if (directionalLights.length > 0) {
      if (uDirDirectionsLoc) this.gl.uniform3fv(uDirDirectionsLoc, dirDirectionsFlat);
      if (uDirColorsLoc) this.gl.uniform3fv(uDirColorsLoc, dirColorsFlat);
    }
  }

  protected loadPointLights(pointLights: PointLight[]) {
    // Get uniform locations (ensuring '[0]' for array uniforms)
    const uNumPointLightsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_numPointLights');
    const uPointPositionsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_pointLightPositions[0]');
    const uPointColorsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_pointLightColors[0]');
    const uPointConstAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_pointLightConstantAtts[0]');
    const uPointLinearAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_pointLightLinearAtts[0]');
    const uPointQuadraticAttsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_pointLightQuadraticAtts[0]');

    const pointPositionsFlat: number[] = [];
    const pointColorsFlat: number[] = [];
    const pointConstAttsFlat: number[] = [];
    const pointLinearAttsFlat: number[] = [];
    const pointQuadraticAttsFlat: number[] = [];

    pointLights.forEach(light => {
      pointPositionsFlat.push(...light.transform.position);
      pointColorsFlat.push(light.color[0], light.color[1], light.color[2]);
      pointConstAttsFlat.push(light.attenuation.constant);
      pointLinearAttsFlat.push(light.attenuation.linear);
      pointQuadraticAttsFlat.push(light.attenuation.quadratic);
    });

    // Only send uniforms if the location is valid
    if (uNumPointLightsLoc) this.gl.uniform1i(uNumPointLightsLoc, pointLights.length);
    if (pointLights.length > 0) {
      if (uPointPositionsLoc) this.gl.uniform3fv(uPointPositionsLoc, pointPositionsFlat);
      if (uPointColorsLoc) this.gl.uniform3fv(uPointColorsLoc, pointColorsFlat);
      if (uPointConstAttsLoc) this.gl.uniform1fv(uPointConstAttsLoc, pointConstAttsFlat);
      if (uPointLinearAttsLoc) this.gl.uniform1fv(uPointLinearAttsLoc, pointLinearAttsFlat);
      if (uPointQuadraticAttsLoc) this.gl.uniform1fv(uPointQuadraticAttsLoc, pointQuadraticAttsFlat);
    }
  }
}
