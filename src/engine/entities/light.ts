import { Transform } from "@engine/core/transform";
import { GlEntity } from "./entity";
import { vec3, vec4 } from "gl-matrix";
import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";

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
    this.color = vec4.fromValues(0.2,0.2,0.2, 0.1);
  }
}

// Example Light Structures
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
