import { DirectionalLight, Light, PointLight, SpotLight } from "@engine/entities/light";
import { EntityType } from "@engine/enums/entity-type";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { LitMaterial } from "@engine/materials/lit-material";
import { LitShader } from "@engine/shaders/lit-shader";
import { vec3 } from "gl-matrix";
import { RendererBehaviour } from "./renderer-behaviour";

export class RenderMeshBehaviour extends RendererBehaviour {

  static override instanciate(gl: WebGL2RenderingContext): RenderMeshBehaviour {
    return new RenderMeshBehaviour(gl);
  }

  protected normalMapUniformLocation: WebGLUniformLocation | null = null;
  protected tangentAttributeLocation: GLint = -1;
  protected bitangentAttributeLocation: GLint = -1;
  public enableNormalmaps = true;
  public enableLights = true;


  constructor(public override gl: WebGL2RenderingContext) {
    super(gl);
  }

  override draw(): void {
    if (!this.mesh || !this.shader.shaderProgram) { return }

    this.getNormalMapLocations();
    this.shader.bindBuffers();
    this.shader.use();
    this.setShaderVariables();
    this.gl.drawElements(this.gl.TRIANGLES, this.mesh.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }



  protected override initializeShader() {
    super.initializeShader();

    this.shader.buffers.normal = this.gl.createBuffer();
    this.shader.buffers.tangent = this.gl.createBuffer();
    this.shader.buffers.bitangent = this.gl.createBuffer();
    this.shader.initBuffers(this.gl, this.mesh.meshData);

  }

  protected override setShaderVariables() {
    this.setLightInformation();
    this.setNormalMapsInformation();
    super.setShaderVariables();
  }

  protected getNormalMapLocations() {
    if (this.shader.shaderProgram && this.enableNormalmaps) {
      this.normalMapUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, ShaderUniformsEnum.U_NORMAL_MAP);
      this.worldMatrixUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, ShaderUniformsEnum.U_WORLD_MATRIX);
      this.worldInverseTransposeMatrixUniformLocation = this.gl.getUniformLocation(this.shader.shaderProgram, ShaderUniformsEnum.U_WORLD_INVERSE_TRANSPOSE_MATRIX);
      this.tangentAttributeLocation = this.gl.getAttribLocation(this.shader.shaderProgram, ShaderUniformsEnum.A_TANGENT);
      this.bitangentAttributeLocation = this.gl.getAttribLocation(this.shader.shaderProgram, ShaderUniformsEnum.A_BITANGENT);
    }
  }

  protected setNormalMapsInformation() {
    const material = this.shader.material as LitMaterial;
    // If a normal map texture is provided, bind and pass it
    if (material.normalTex && material.normalTex.glTexture && this.normalMapUniformLocation) {
      this.gl.activeTexture(this.gl.TEXTURE1); // Use texture unit 1 for normal map
      this.gl.bindTexture(this.gl.TEXTURE_2D, material.normalTex.glTexture);
      this.gl.uniform1i(this.normalMapUniformLocation, 1); // Tell the shader u_normalMap is on TEXTURE1
    }
  }



  protected setLightInformation() {
    if (this.shader instanceof LitShader && this.enableLights) {
      const lights = this.parent.scene.lights.filter(light => light.active && light.show);

      const ambientLight = lights.find(l => l.entityType === EntityType.LIGHT_AMBIENT);
      if (ambientLight) {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, ambientLight.color.toVec4());
      } else {
        this.shader.setVec4(ShaderUniformsEnum.U_AMBIENT_LIGHT, [0.1, 0.1, 0.1, 1]);
      }

      this.createLightObjectInfo(lights);
    }
  }

  protected createLightObjectInfo(sceneLights: Light[]) {
    if (this.enableLights == false) return;
    const directionalLights: DirectionalLight[] = sceneLights.filter(e => e.entityType === EntityType.LIGHT_DIRECTIONAL) as DirectionalLight[];
    const pointLights: PointLight[] = sceneLights.filter(e => e.entityType === EntityType.LIGHT_POINT) as PointLight[];
    const spotLights: SpotLight[] = sceneLights.filter(e => e.entityType === EntityType.LIGHT_SPOT) as SpotLight[];

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
      spotColorsFlat.push(...light.color.toVec3());
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
      dirColorsFlat.push(...light.color.toVec3());
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
      pointColorsFlat.push(...light.color.toVec3());
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
