import { Transform } from "@engine/core/transform";
import { GlEntity } from "../entities/entity";

export abstract class EntityBehaviour {

  public active: boolean = true;
  public parent!: GlEntity;

  public get transform(): Transform {  return this.parent.transform; }

  constructor() { }

  public initialize(): void { }
  public update(ellapsed: number): void { }
  public draw(): void { }
  public destroy(): void { }
}
