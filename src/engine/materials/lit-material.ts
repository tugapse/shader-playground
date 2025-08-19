import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "../textures/texture";
import { UnlitMaterial } from "./unlit-material";

export class LitMaterial extends UnlitMaterial {

  public normalTexUrl: string = "";
  public specularStrength: number = 1.0;
  public roughness: number = 0.2;
  public normalMapStrength: number = 0.2;

  public normalTex!: Texture;

  override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      normalTexUrl: this.normalTexUrl,
      specularStrength: this.specularStrength,
      roughness: this.roughness,
      normalMapStrength: this.normalMapStrength
    }
  }
}
