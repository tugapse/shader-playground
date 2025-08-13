import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "./texture";

export class UnlitMaterial extends Material {
  public override name: string="Unlit Material";
  public color: vec4 = vec4.fromValues(1,1,1,1);
  public mainTexUrl: string = "assets/images/wood-texture.jpg";
  public uvScale:vec2 = vec2.fromValues(3,1);
  public uvOffset: vec2 = vec2.create();
  public mainTex!: Texture;
}
