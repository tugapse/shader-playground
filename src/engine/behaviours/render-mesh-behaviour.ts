import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";

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


    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

}
