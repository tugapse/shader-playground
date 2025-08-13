import { vec2, vec4 } from "gl-matrix";
import { Material } from "./material";
import { Texture } from "./texture";

export class AlbedoMaterial extends Material {
  public color: vec4 = vec4.fromValues(0.5, 0.2, 0.5, 1);
  public mainTexUrl: string = "http://localhost:4200/assets/images/wood-texture.jpg";
  public mainTex!: Texture;
  public scale: vec2 = vec2.fromValues(1,1);
  public uvScale:vec2 = vec2.fromValues(3,5);
}
