import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec3, vec4 } from "gl-matrix";

export class Color implements JsonSerializable {

  public static createFromJsonData(jsonData: JsonSerializedData) {
    const color = new Color();
    color.fromJson(jsonData);
    return color;
  }

  constructor(public r: number = 1, public g: number = 1, public b: number = 1, public a: number = 1) { }

  public toJsonObject(): { [key: string]: any; } {
    return {
      type: this.constructor.name,
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    }
  }

  public fromJson(jsonObject: { [key: string]: any; }): void {
    this.r = jsonObject['r'];
    this.g = jsonObject['g'];
    this.b = jsonObject['b'];
  }

  public toVec3() {
    return vec3.fromValues(this.r, this.g, this.b);
  }

  public toVec4() {
    return vec4.fromValues(this.r, this.g, this.b, this.a);
  }
}
