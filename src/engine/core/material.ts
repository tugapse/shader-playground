import { vec4 } from "gl-matrix";
import { Shader } from "./shader";

export class Material{

  public color:vec4 = [0.5,0.2,0.5,1];
  public shader!:Shader;

}
