import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "./texture";

export class UnlitMaterial extends Material {
  public color: vec4 = vec4.fromValues(1,1,1,1);
  public mainTexUrl: string = "assets/images/wood-texture.jpg";
  public mainTex!: Texture;
  public scale: vec2 = vec2.fromValues(1,1);
  public uvScale:vec2 = vec2.fromValues(1,1);
}
