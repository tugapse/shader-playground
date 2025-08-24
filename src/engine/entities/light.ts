import { Transform } from "@engine/core/transform";
import { EntityType } from "@engine/enums/entity-type";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec3, vec4 } from "gl-matrix";
import { GlEntity } from "./entity";
import { Color } from "@engine/core/color";



export class Light extends GlEntity {

  public override entityType: EntityType = EntityType.LIGHT_AMBIENT;
  public color: Color ;

  constructor(name: string) {
    super(name);
    this.color = new Color(0.2, 0.2, 0.2, 0.1);
    this.entityType = EntityType.LIGHT_AMBIENT;
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      color: this.color.toJsonObject()
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.color = Color.createFromJsonData(jsonObject['color']);
  }

  static override instanciate(name?: string, transform?: Transform): Light {
    return new Light(name || "Light");
  }
}

export class DirectionalLight extends Light {

  public direction!: vec3;
  public override entityType: EntityType = EntityType.LIGHT_DIRECTIONAL;
  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_DIRECTIONAL;
  }
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      direction: [...this.direction]
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    debugger
    this.direction = jsonObject['direction'];
  }

  static override instanciate(name?: string, transform?: Transform): DirectionalLight {
    return new DirectionalLight(name || "Directional Light");
  }
}

export class PointLight extends Light {
  public override entityType: EntityType = EntityType.LIGHT_POINT;
  public attenuation!: { constant: number; linear: number; quadratic: number };


  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_POINT;
  }


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
  public override entityType: EntityType = EntityType.LIGHT_SPOT;
  public direction!: vec3;
  public coneAngles!: { inner: number; outer: number; };
  public attenuation!: { constant: number; linear: number; quadratic: number };

  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_SPOT;
  }

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

