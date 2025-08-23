import { GlEntity } from "@engine/entities/entity";

export class EntityInspector {
  protected _target?: GlEntity | null;

  constructor(target?: GlEntity) {
    if (target) { this.setTarget(target); }
  }

  public setTarget(target: GlEntity) {
    this._target = target
  };
}
