import { Color } from "@engine/core/color";
import { Colors } from "@engine/core/colors";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec4 } from "gl-matrix";

export class ColorMaterial extends JsonSerializable {

  public static instanciate() { return new ColorMaterial(); }

  public name: string = "Color Material";
  public color: Color = new Color();

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      color: this.color.toJsonObject(),

    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    this.name = jsonObject['name'];
    debugger
    this.color = Color.createFromJsonData(jsonObject['color']);

  }
}
