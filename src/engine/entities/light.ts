import { vec3, vec4 } from "gl-matrix";
import { GlEntity } from "./entity";
import { LightType } from "@engine/enums/light-type.enum";



export class Light extends GlEntity {
  public lightType: LightType = LightType.AMBIENT;
  public color: vec4;
  constructor(name: string) {
    super(name);
    this.color = vec4.fromValues(0.2,0.2,0.2, 0.1);
  }
}

export class DirectionalLight extends Light {

  public direction!: vec3;
  override lightType: LightType = LightType.DIRECTIONAL;
}

export class PointLight extends Light {
  override lightType: LightType = LightType.POINT;
  public attenuation!: { constant: number; linear: number; quadratic: number };
}

export class SpotLight extends DirectionalLight {
  override lightType: LightType = LightType.SPOT;
  public coneAngles!: { inner: number; outer: number; };
  public attenuation!: { constant: number; linear: number; quadratic: number };
}
