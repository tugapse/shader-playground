import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "../textures/texture";
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { ColorMaterial } from "./color-material";

export class UnlitMaterial extends ColorMaterial implements JsonSerializable {
  public mainTexUrl: string = "";
  public uvScale: vec2 = vec2.fromValues(1, 1);
  public uvOffset: vec2 = vec2.create();
  public mainTex!: Texture;

  override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      color: this.color,
      mainTexUrl: this.mainTexUrl,
      uvScale: this.uvScale,
      uvOffset: this.uvOffset
    }
  }
  override fromJson(jsonObject: { [key: string]: any; }): void {
    this.name = jsonObject['name'];
    this.color = jsonObject['color'];
    this.mainTexUrl = jsonObject['mainTexUrl'];
    this.uvScale = jsonObject['uvScale'];
    this.uvOffset = jsonObject['uvOffset'];
  }
}
