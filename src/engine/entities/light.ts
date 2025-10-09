import { vec3 } from "gl-matrix";
import { Color } from "../core/color";
import { Transform } from "../core/transform";
import { Vector3 } from "../core/vector";
import { EntityType } from "../enums/entity-type.enum";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { GlEntity } from "./entity";

/**
  Defines the properties for light attenuation, controlling how light intensity diminishes with distance.
 */
export class LightAttenuation {
  /**
    The constant component of attenuation.
   * @type {number}
   */
  public constant!: number;
  /**
    The linear component of attenuation.
   * @type {number}
   */
  public linear!: number;
  /**
    The quadratic component of attenuation.
   * @type {number}
   */
  public quadratic!: number;
}

/**
  Defines the properties for the cone angles of a spotlight.
 */
export class LightConeAngles {
  /**
    The inner cone angle in degrees.
   * @type {number}
   */
  public inner!: number;
  /**
    The outer cone angle in degrees.
   * @type {number}
   */
  public outer!: number;
}

/**
  The base class for all light types in the engine.
 * @augments {GlEntity}
 */
export class Light extends GlEntity {

  protected override _className = "Light";
  
  /**
    The type of the entity, specifically set to LIGHT_AMBIENT.
   * @override
   * @type {EntityType}
   */
  public override entityType: EntityType = EntityType.LIGHT_AMBIENT;
  /**
    The color and intensity of the light.
   * @type {Color}
   */
  public color: Color;

  /**
    Creates an instance of Light.
   * @param {string} name - The name of the light entity.
   */
  constructor(name: string) {
    super(name);
    this.color = new Color(0.2, 0.2, 0.2, 1);
    this.entityType = EntityType.LIGHT_AMBIENT;
  }

  /**
    Serializes the light's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      color: this.color.toJsonObject(),
    };
  }

  /**
    Deserializes the light's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.color = Color.createFromJsonData(jsonObject['color']);
  }

  /**
    Creates a new Light instance.
    
   * @override
   * @param {string} [name="Light"] - The name of the light.
   * @param {Transform} [transform] - The transform for the light.
   * @returns {Light} - The newly created Light instance.
   */
  static override instanciate(name?: string, transform?: Transform): Light {
    return new Light(name || "Light");
  }
}

/**
  Represents a directional light source, which simulates light from a distant source like the sun.
 * @augments {Light}
 */
export class DirectionalLight extends Light {

   protected override _className = "DirectionalLight"; 

  /**
    Gets the direction of the light, derived from the transform's rotation.
   * @readonly
   * @type {vec3}
   */
  public get direction(): vec3 {
    return vec3.normalize(vec3.create(), this.transform.back);
  }
  /**
    The type of the entity, specifically set to LIGHT_DIRECTIONAL.
   * @override
   * @type {EntityType}
   */
  public override entityType: EntityType = EntityType.LIGHT_DIRECTIONAL;

  /**
    Creates an instance of DirectionalLight.
   * @param {string} name - The name of the light entity.
   */
  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_DIRECTIONAL;
  }

  /**
    Serializes the directional light's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject()
    };
  }

  /**
    Deserializes the directional light's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
  }

  /**
    Creates a new DirectionalLight instance.
    
   * @override
   * @param {string} [name="Directional Light"] - The name of the directional light.
   * @param {Transform} [transform] - The transform for the directional light.
   * @returns {DirectionalLight} - The newly created DirectionalLight instance.
   */
  static override instanciate(name?: string, transform?: Transform): DirectionalLight {
    return new DirectionalLight(name || "Directional Light");
  }
}

/**
  Represents a point light source, which emits light in all directions from a single point.
 * @augments {Light}
 */
export class PointLight extends Light {
   protected override _className = "PointLight"; 
  
  /**
    The type of the entity, specifically set to LIGHT_POINT.
   * @override
   * @type {EntityType}
   */
  public override entityType: EntityType = EntityType.LIGHT_POINT;
  /**
    The attenuation properties of the light.
   * @type {LightAttenuation}
   */
  public attenuation!: LightAttenuation;

  /**
    Creates an instance of PointLight.
   * @param {string} name - The name of the light entity.
   */
  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_POINT;
    this.attenuation = new LightAttenuation();
  }

  /**
    Serializes the point light's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      attenuation: this.attenuation,
    };
  }

  /**
    Deserializes the point light's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.attenuation = jsonObject['attenuation'];
  }

  /**
    Creates a new PointLight instance.
    
   * @override
   * @param {string} [name="Light"] - The name of the point light.
   * @param {Transform} [transform] - The transform for the point light.
   * @returns {PointLight} - The newly created PointLight instance.
   */
  static override instanciate(name?: string, transform?: Transform): PointLight {
    return new PointLight(name || "Light");
  }
}

/**
  Represents a spot light source, which emits light in a cone shape.
 * @augments {Light}
 */
export class SpotLight extends Light {
  
   protected override _className = "SpotLight"; 

  /**
    The type of the entity, specifically set to LIGHT_SPOT.
   * @override
   * @type {EntityType}
   */
  public override entityType: EntityType = EntityType.LIGHT_SPOT;
  /**
    The cone angles that define the shape of the spotlight.
   * @type {LightConeAngles}
   */
  public coneAngles!: LightConeAngles;
  /**
    The attenuation properties of the light.
   * @type {LightAttenuation}
   */
  public attenuation!: LightAttenuation;
  /**
    Gets the direction of the light, derived from the transform's rotation.
   * @readonly
   * @type {vec3}
   */
  public get direction(): vec3 {
    return this.transform.worldRotation;
  }

  /**
    Creates an instance of SpotLight.
   * @param {string} name - The name of the light entity.
   */
  constructor(name: string) {
    super(name);
    this.entityType = EntityType.LIGHT_SPOT;
    this.coneAngles = new LightConeAngles();
    this.attenuation = new LightAttenuation();
  }

  /**
    Serializes the spot light's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      coneAngles: this.coneAngles,
      attenuation: this.attenuation,
    };
  }

  /**
    Deserializes the spot light's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.coneAngles = jsonObject['coneAngles'];
    this.attenuation = jsonObject['attenuation'];
  }

  /**
    Creates a new SpotLight instance.
    
   * @override
   * @param {string} [name="Light"] - The name of the spot light.
   * @param {Transform} [transform] - The transform for the spot light.
   * @returns {SpotLight} - The newly created SpotLight instance.
   */
  static override instanciate(name?: string, transform?: Transform): SpotLight {
    return new SpotLight(name || "Light");
  }
}