import { mat4, vec2 } from "gl-matrix";
import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";
import { Camera } from "../core/camera";
import { Screen } from "../core/screen";
import { ColorMaterial } from "../materials/color-material";
import { Shader } from "../shaders/shader";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
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
    this.shader.initialize()
    this.shader.setVertexBuffer(this.mesh.meshData.vertices);
  }

  override draw(): void {

    if (!this.mesh) { return }


    if (this.shader.shaderProgram) {

      this.shader.load();
      this.shader.use()
      this.setShaderVariables();
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.mesh.meshData.vertices.length);
    }


  }

  protected setShaderVariables() {
    const camera = Camera.mainCamera;
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
    this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
    this.shader.setfloat(ShaderUniformsEnum.U_TIME, this.time);
    this.shader.setVec2(ShaderUniformsEnum.U_SCREEN_RESOLUTION, [Screen.rendererWidth, Screen.rendererHeight]);
    this.shader.loadDataIntoShader();
  }


}
