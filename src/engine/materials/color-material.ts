import { vec4 } from "gl-matrix";
import { Material } from "./material";

export class ColorMaterial extends Material{
  public color:vec4 = [0.5,0.2,0.5,1];
}
