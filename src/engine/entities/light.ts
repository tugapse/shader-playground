import { vec3, vec4 } from "gl-matrix";
import { GlEntity } from "./entity";
import { LightType } from "@engine/enums/light-type.enum";



export class Light extends GlEntity {
  public lightType: LightType = LightType.AMBIENT;
  public color: vec4;
  constructor(name: string) {
    super(name);
    this.color = vec4.fromValues(0.2, 0.2, 0.2, 0.1);
  }

  public override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      lightType: this.lightType,
      color: this.color
    }
  }
}

export class DirectionalLight extends Light {

  public direction!: vec3;
  override lightType: LightType = LightType.DIRECTIONAL;

  public override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      direction: this.direction
    }
  }
}

export class PointLight extends Light {
  override lightType: LightType = LightType.POINT;
  public attenuation!: { constant: number; linear: number; quadratic: number };
  public override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      attenuation: this.attenuation
    }
  }
}

export class SpotLight extends Light {
  override lightType: LightType = LightType.SPOT;
  public direction!: vec3;
  public coneAngles!: { inner: number; outer: number; };
  public attenuation!: { constant: number; linear: number; quadratic: number };

  public override toJsonObject(): { [key: string]: any; } {
    return {
      ...super.toJsonObject(),
      coneAngles: this.coneAngles,
      attenuation: this.attenuation,
      direction: this.direction
    }
  }
}
