import { vec4 } from "gl-matrix";
import { Material } from "./material";
import { JsonSerializable } from "@engine/interfaces/json-serializable";

export class ColorMaterial extends Material implements JsonSerializable {
  public color: vec4 = vec4.fromValues(1, 1, 1, 1);
  override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      color: this.color,

    }
  }
  override fromJson(jsonObject: { [key: string]: any; }): void {
    this.name = jsonObject['name'];
    this.color = jsonObject['color'];

  }
}
