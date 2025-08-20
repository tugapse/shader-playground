import { Transform } from "@engine/core/transform";
import { GlEntity } from "../entities/entity";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";

export abstract class EntityBehaviour implements JsonSerializable {

  public active: boolean = true;
  public parent!: GlEntity;

  public get transform(): Transform { return this.parent.transform; }

  constructor() { }

  public initialize(): void { }
  public update(ellapsed: number): void { }
  public updateEditor(ellapsed: number): void { }
  public draw(): void { }
  public destroy(): void { }
  public toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      active: this.active
    }
  }
  public fromJson(jsonObject: JsonSerializedData): void {
    this.active = jsonObject['active'];
  }
}
