import { mat4, vec2 } from "gl-matrix";
import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";
import { Camera } from "../core/camera";
import { Screen } from "../core/screen";
import { Material } from "../core/material";
export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!: Mesh;
  public material!:Material;

  private time = 0;

  constructor(public override parent: GlEntity, private gl: WebGLRenderingContext) {
    super(parent)
  }

  override update(ellapsed: number): void {
    this.time += ellapsed;
  }

  override initialize(): void {
    this.material.shader.initialize()
    this.material.shader.setVertexBuffer(this.mesh.meshData.vertices);
  }

  override draw(): void {

    if (!this.mesh) { return }


    if (this.material.shader.shaderProgram) {

      this.material.shader.load();
      this.material.shader.use()
      this.setShaderVariables();
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.mesh.meshData.vertices.length);
    }


  }

  protected setShaderVariables() {
    const camera = Camera.mainCamera;
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
    this.material.shader.setMat4("u_mvpMatrix", mvpMatrix);
    this.material.shader.setfloat("u_time", this.time);
    this.material.shader.setVec2("u_screenResolution",[ Screen.rendererWidth,Screen.rendererHeight]);
    this.setMaterial();
  }

  private setMaterial() {
    if(!this.material) return;

    this.material.shader.setVec4("u_matColor", this.material.color);

  }

}
