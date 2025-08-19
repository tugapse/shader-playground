import { Transform } from "@engine/core/transform";
import { GlEntity } from "../entities/entity";
import { JsonSerializable } from "@engine/interfaces/json-serializable";

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
  public toJsonObject(): { [key: string]: any; } {
    return {
      type: this.constructor.name
    }
  }
  public fromJson(jsonObject: { [key: string]: any; }): void { }


}
