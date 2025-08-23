import { Color } from "@engine/core/color";
import { Colors } from "@engine/core/colors";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec4 } from "gl-matrix";

export class ColorMaterial implements JsonSerializable {

  public static instanciate() { return new ColorMaterial(); }

  public name: string = "Color Material";
  public color: Color = Colors.white;

  toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      color: this.color,

    }
  }

  fromJson(jsonObject: JsonSerializedData): void {
    this.name = jsonObject['name'];
    this.color = new Color();
    this.color.fromJson(jsonObject['color']);

  }
}
