import { mat4, vec2, vec3 } from "gl-matrix";
import { EntityBehaviour } from "./entity-behaviour";
import { Mesh } from "../core/mesh";
import { CanvasViewport } from "../core/canvas-viewport";
import { ColorMaterial } from "../materials/color-material";
import { Shader } from "../shaders/shader";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { GlEntity } from "../entities/entity";
import { Camera } from "../entities/camera";
import { LitShader } from "@engine/shaders/lit-shader"; // Assuming correct path
import { DirectionalLight, Light, LightType, PointLight, SpotLight } from "@engine/entities/light"; // Assuming correct path and types

export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!: Mesh;
  public material!: ColorMaterial;
  public shader!: Shader;

  protected time = 0;

  constructor(public override parent: GlEntity, protected gl: WebGLRenderingContext) {
    super(parent)
  }

  override initialize(): void {
    this.initializeGlSettings();
    this.initializeShader(); // Fixed typo
  }

  override update(ellapsed: number): void {
    this.time += ellapsed;
  }

  override draw(): void {
    if (!this.mesh || !this.shader.shaderProgram) { return }

    this.shader.bindBuffers();
    this.shader.use()
    this.setShaderVariables();
    this.gl.drawElements(this.gl.TRIANGLES, this.mesh.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  protected setShaderVariables() {
    this.setCameraMatrices();
    this.setLightInformation();
    this.shader.setfloat(ShaderUniformsEnum.U_TIME, this.time);
    this.shader.setVec2(ShaderUniformsEnum.U_SCREEN_RESOLUTION, [CanvasViewport.rendererWidth, CanvasViewport.rendererHeight]);

    this.shader.loadDataIntoShader();
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
    this.shader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, this.parent.transform.modelMatrix);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, this.parent.transform.modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    this.shader.setMat4(ShaderUniformsEnum.U_NORMAL_MATRIX, normalMatrix);
  }

  protected setLightInformation() {
    if (this.shader instanceof LitShader) {
      const lights = this.parent.scene.lights;

      const ambientLight = lights.find(l => l.lightType === LightType.AMBIENT); // Use strict equality
      if (ambientLight) {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, ambientLight.color);
      } else {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, [0.01, 0.01, 0.01, 1]);
      }

      this.createLightObjectInfo(lights);
    }
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

  protected initializeShader() { // Fixed typo
    this.shader.initialize();
    this.shader.buffers.position = this.gl.createBuffer();
    this.shader.buffers.normal = this.gl.createBuffer();
    this.shader.buffers.uv = this.gl.createBuffer();
    this.shader.buffers.indices = this.gl.createBuffer();

    this.shader.initBuffers(this.gl, this.mesh.meshData);
  }

  createLightObjectInfo(sceneLights: Light[]) {
    const directionalLights: DirectionalLight[] = sceneLights.filter(e => e.lightType === LightType.DIRECTIONAL) as DirectionalLight[];
    const pointLights: PointLight[] = sceneLights.filter(e => e.lightType === LightType.POINT) as PointLight[];
    const spotLights: SpotLight[] = sceneLights.filter(e => e.lightType === LightType.SPOT) as SpotLight[];

    this.loadDirectionalLights(directionalLights); // Fixed typo
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
      spotColorsFlat.push(light.color[0],light.color[1],light.color[2]);
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

  protected loadDirectionalLights(directionalLights: DirectionalLight[]) { // Fixed typo
    // Get uniform locations (ensuring '[0]' for array uniforms)
    const uNumDirLightsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_numDirectionalLights');
    const uDirDirectionsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_directionalLightDirections[0]'); // Fixed
    const uDirColorsLoc = this.gl.getUniformLocation(this.shader.shaderProgram!, 'u_directionalLightColors[0]');     // Fixed

    const dirDirectionsFlat: number[] = [];
    const dirColorsFlat: number[] = [];

    directionalLights.forEach(light => {
      const normalizedDir = vec3.normalize(vec3.create(), light.direction);
      dirDirectionsFlat.push(...normalizedDir);
      dirColorsFlat.push(light.color[0],light.color[1],light.color[2]);
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
      pointColorsFlat.push(light.color[0],light.color[1],light.color[2]);
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
