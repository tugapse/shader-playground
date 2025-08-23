import { SceneManager } from "@engine/entities/scene-manager";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec3, vec4 } from "gl-matrix";

export class Color extends JsonSerializable {

  public static createFromJsonData(jsonData: JsonSerializedData) {
    const color = new Color();
    color.fromJson(jsonData);
    return color;
  }
  // getters
  public get r() { return this.vector[0]; }
  public get g() { return this.vector[1]; }
  public get b() { return this.vector[2]; }
  public get a() { return this.vector[3]; }
  // setters
  public set g(value: number) { this.vector[1] = value; }
  public set r(value: number) { this.vector[0] = value; }
  public set b(value: number) { this.vector[2] = value; }
  public set a(value: number) { this.vector[3] = value; }


  private vector: vec4;
  constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
    super()
    this.vector = vec4.fromValues(r, g, b, a);
  }

  public override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a
    }
  }

  public override fromJson(jsonObject: { [key: string]: any; }): void {
    this.r = jsonObject['r'];
    this.g = jsonObject['g'];
    this.b = jsonObject['b'];
  }

  public toVec3() {
    return vec3.fromValues(this.r, this.g, this.b);
  }

  public toVec4() {
    return this.vector;
  }
}

SceneManager.addDependency(Color.name, () => new Color())
