import { vec3, vec4 } from "gl-matrix";
import { GlEntity } from "./entity";
import { LightType } from "@engine/enums/light-type.enum";
import { Transform } from "@engine/core/transform";
import { SceneManager } from "./scene-manager";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";



export class Light extends GlEntity {
  public lightType: LightType = LightType.AMBIENT;
  public color: vec4;
  constructor(name: string) {
    super(name);
    this.color = vec4.fromValues(0.2, 0.2, 0.2, 0.1);
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      lightType: this.lightType,
      color: [...this.color]
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.lightType = jsonObject['lightType'] as LightType;
    this.color = jsonObject['color']
  }

  static override instanciate(name?: string, transform?: Transform): Light {
    return new Light(name || "Light");
  }
}

export class DirectionalLight extends Light {

  public direction!: vec3;
  override lightType: LightType = LightType.DIRECTIONAL;

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      direction: [...this.direction]
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.direction = jsonObject['direction'];
  }

  static override instanciate(name?: string, transform?: Transform): DirectionalLight {
    return new DirectionalLight(name || "Directional Light");
  }
}

export class PointLight extends Light {
  override lightType: LightType = LightType.POINT;
  public attenuation!: { constant: number; linear: number; quadratic: number };
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      attenuation: this.attenuation
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.attenuation = jsonObject['attenuation'];
  }

  static override instanciate(name?: string, transform?: Transform): PointLight {
    return new PointLight(name || "Light");
  }
}

export class SpotLight extends Light {
  override lightType: LightType = LightType.SPOT;
  public direction!: vec3;
  public coneAngles!: { inner: number; outer: number; };
  public attenuation!: { constant: number; linear: number; quadratic: number };

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      coneAngles: this.coneAngles,
      attenuation: this.attenuation,
      direction: [...this.direction]
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.direction = jsonObject['direction'] as vec4;
    this.coneAngles = jsonObject['coneAngles'];
    this.attenuation = jsonObject['attenuation'];
  }

  static override instanciate(name?: string, transform?: Transform): SpotLight {
    return new SpotLight(name || "Light");
  }
}

