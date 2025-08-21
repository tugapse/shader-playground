import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec4 } from "gl-matrix";

export class ColorMaterial implements JsonSerializable {

  public static instanciate(){ return new ColorMaterial(); }
  public name:string="Color Material";
  public color: vec4 = vec4.fromValues(1, 1, 1, 1);

   toJsonObject(): JsonSerializedData {
    return {
      type:this.constructor.name,
      color: [...this.color],

    }
  }
   fromJson(jsonObject: JsonSerializedData): void {
    debugger
    this.name = jsonObject['name'];
    this.color = vec4.fromValues(
      jsonObject['color'][0],
      jsonObject['color'][1],
      jsonObject['color'][2],
      jsonObject['color'][3]);

  }

  public parseJsonColor(){}
}
