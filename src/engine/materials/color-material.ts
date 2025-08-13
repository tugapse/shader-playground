import { vec4 } from "gl-matrix";
import { Material } from "./material";

export class ColorMaterial extends Material{
    public color:vec4=vec4.fromValues(1,1,1,1);
}
