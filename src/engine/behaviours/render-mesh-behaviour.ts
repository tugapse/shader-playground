import { mat4, vec2 } from "gl-matrix";
import { EntityBehaviour } from "./entity-behaviour";
import { Mesh } from "../core/mesh";
import { CanvasViewport } from "../core/canvas-viewport";
import { ColorMaterial } from "../materials/color-material";
import { Shader } from "../shaders/shader";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { GlEntity } from "../entities/entity";
import { Camera } from "../entities/camera";
export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!: Mesh;
  public material!: ColorMaterial;
  public shader!: Shader;

  private time = 0;

  constructor(public override parent: GlEntity, private gl: WebGLRenderingContext) {
    super(parent)
  }

  override update(ellapsed: number): void {
    this.time += ellapsed;
  }

  override initialize(): void {
    this.gl.enable(this.gl.DEPTH_TEST);
    // this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);

    this.shader.initialize()
    this.shader.buffers.position = this.gl.createBuffer();
    this.shader.buffers.normal = this.gl.createBuffer();
    this.shader.buffers.uv = this.gl.createBuffer();
    this.shader.buffers.indices = this.gl.createBuffer();

    this.shader.initBuffers(this.gl, this.mesh.meshData);
  }

  override draw(): void {

    if (!this.mesh) { return }
    if (this.shader.shaderProgram) {

      this.shader.bindBuffers();
      this.shader.use()
      this.setShaderVariables();
      this.gl.drawElements(this.gl.TRIANGLES, this.mesh.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
  }

  protected setShaderVariables() {
    const camera = Camera.mainCamera;
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
    this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
    this.shader.setfloat(ShaderUniformsEnum.U_TIME, this.time);
    this.shader.setVec2(ShaderUniformsEnum.U_SCREEN_RESOLUTION, [CanvasViewport.rendererWidth, CanvasViewport.rendererHeight]);


    this.shader.loadDataIntoShader();
  }


}
