import { mat4 } from "gl-matrix";
import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";
import { Camera } from "../core/camera";

export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!:Mesh;

  constructor( public override parent: GlEntity, private gl: WebGLRenderingContext ) {
    super(parent)
  }

  public override initialize(): void {
    this.mesh.shader.initialize()
    this.mesh.shader.setVertexBuffer(this.mesh.meshData.vertices);
  }

  public override draw(): void {

    if(!this.mesh){ return }

    this.mesh.shader.load();
    this.mesh.shader.use()
    const camera = Camera.mainCamera;
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);


    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.mesh.meshData.vertices.length );
  }

}
