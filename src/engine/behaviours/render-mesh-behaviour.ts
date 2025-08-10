import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";

export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!:Mesh;

  constructor( public override parent: GlEntity, private gl: WebGLRenderingContext ) {
    super(parent)
  }

  public override draw(): void {
    if(!this.mesh){ return }

    this.mesh.shader.initialize()
    this.mesh.shader.use()


  }

}
