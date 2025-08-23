import { Transform } from "@engine/core/transform";
import { GlEntity } from "../entities/entity";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";

export abstract class EntityBehaviour extends JsonSerializable {
  static instanciate(args?: any): any { }

  public active: boolean = true;
  public parent!: GlEntity;
  protected _initialized = false;

  public get transform(): Transform { return this.parent.transform; }

  constructor() {
    super();
  }

  public initialize(): boolean { return this._initialized = true; }
  public update(ellapsed: number): void { }
  public updateEditor(ellapsed: number): void { }
  public draw(): void { }
  public destroy(): void { }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      active: this.active
    }
  }
  public override fromJson(jsonObject: JsonSerializedData): void {
    this.active = jsonObject['active'];
  }

  public clone(): EntityBehaviour | null { return null }
}
