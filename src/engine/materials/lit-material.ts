import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "./texture";

export class LitMaterial extends Material {

  public color: vec4 = vec4.fromValues(1,1,1,1);
  public mainTexUrl: string = "assets/images/wood-texture.jpg";
  public normalTexUrl: string = "";

  public uvScale:vec2 = vec2.fromValues(1,1);
  public uvOffset: vec2 = vec2.create();

  public mainTex!: Texture;
  public normalTex!: Texture;
}
