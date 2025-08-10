import { GlEntity } from "../core/entity";
import { EntityBehaviour } from "../core/entity-behaviour";
import { Mesh } from "../core/mesh";

export class RenderMeshBehaviour extends EntityBehaviour {

  public mesh!:Mesh;

  constructor( public override parent: GlEntity, private gl: WebGLRenderingContext, ) {
    super(parent)
  }
  public override initialize(): void {
    throw new Error("Method not implemented.");
  }
  public override update(ellapsed: number): void {
    throw new Error("Method not implemented.");
  }
  public override draw(): void {
    throw new Error("Method not implemented.");
  }

}
