import { JsonSerializable } from "@engine/interfaces/json-serializable";

export abstract class Material implements JsonSerializable {

  public name = "Material";

  toJsonObject(): { [key: string]: any; } {
    return {
      type: this.constructor.name,
      name: this.name
    }
  }
  fromJson(jsonObject: { [key: string]: any; }): void {
    throw new Error("Method not implemented.");
  }
}
