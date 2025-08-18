import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "../textures/texture";

export class LitMaterial extends Material {

  public color: vec4 = vec4.fromValues(0.3, 0.3, 0.3, 1);
  public mainTexUrl: string = "";
  public normalTexUrl: string = "";
  public specularStrength: number = 1.0;
  public roughness: number = 0.2;
  public normalMapStrength: number = 0.2;

  public uvScale: vec2 = vec2.fromValues(1, 1);
  public uvOffset: vec2 = vec2.create();

  public mainTex!: Texture;
  public normalTex!: Texture;
}
