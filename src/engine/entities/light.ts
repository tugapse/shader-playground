import { Transform } from "@engine/core/transform";
import { GlEntity } from "./entity";
import { vec3, vec4 } from "gl-matrix";

export enum LightType {
  AMBIENT = 0,
  DIRECTIONAL = 1,
  POINT = 2,
  SPOT = 3,
}

export class Light extends GlEntity {
  public lightType: LightType = LightType.AMBIENT;
  public color: vec4;
  constructor(name: string) {
    super(name);
    this.color = vec4.fromValues(1, 1, 1, 1);
  }
}

// Example Light Structures
export class DirectionalLight extends Light {
  public direction!: vec3;
}

export class PointLight extends Light {
  public attenuation!: { constant: number; linear: number; quadratic: number };
}

export class SpotLight extends DirectionalLight {
  public coneAngles!: { inner: number; outer: number; };
  public attenuation!: { constant: number; linear: number; quadratic: number };
}
