import { vec2, vec3, vec4 } from "gl-matrix";
import { JsonSerializable, JsonSerializedData } from "../interfaces";

/**
  A class representing a 2D vector, backed by a gl-matrix vec2.
 * @augments {JsonSerializable}
 */
export class Vector2 extends JsonSerializable {

  public static get className() { return "Vector2"; }

  /**
    The internal gl-matrix vector.
   * @protected
   * @type {vec2}
   */
  protected _vec: vec2;

  /**
    Gets the internal gl-matrix vector.
   * @returns {vec2} - The internal vector instance.
   */
  public get vector(): vec2 {
    return this._vec;
  }

  /**
    Gets the x-component of the vector.
   * @type {number}
   */
  public get x(): number {
    return this.vector[0];
  }
  /**
    Sets the x-component of the vector.
   * @param {number} value - The new value for the x-component.
   */
  public set x(value: number) {
    this.vector[0] = value;
  }
  /**
    Gets the y-component of the vector.
   * @type {number}
   */
  public get y(): number {
    return this.vector[1];
  }
  /**
    Sets the y-component of the vector.
   * @param {number} value - The new value for the y-component.
   */
  public set y(value: number) {
    this.vector[1] = value;
  }

  /**
    Creates an instance of Vector2.
   * @param {number} [x=0] - The x-component.
   * @param {number} [y=0] - The y-component.
   */
  constructor(x: number = 0, y: number = 0) {
    super("Vector2");
    this._vec = vec2.fromValues(x, y);
  }

  /**
    Deserializes the vector's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.x = jsonObject["x"];
    this.y = jsonObject["y"];
  }

  /**
    Serializes the vector's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      className: Vector2.className,
      x: this.x,
      y: this.y,
    };
  }

  /**
    Sets the components of the vector.
   * @param {number} [x=0] - The new x-component.
   * @param {number} [y=0] - The new y-component.
   * @returns {void}
   */
  public set(x: number = 0, y: number = 0): void {
    this.x = x;
    this.y = y;
  }
}

/**
  A class representing a 3D vector, backed by a gl-matrix vec3.
 * @augments {Vector2}
 */
export class Vector3 extends Vector2 {

  protected override _className = "Vector3"
  /**
    The internal gl-matrix vector.
   * @protected
   * @type {vec3}
   */
  protected override _vec: vec3;

  /**
    Gets the internal gl-matrix vector.
   * @returns {vec3} - The internal vector instance.
   */
  public override get vector(): vec3 {
    return this._vec;
  }

  /**
    Gets the x-component of the vector.
   * @type {number}
   */
  public override get x(): number {
    return this.vector[0];
  }
  /**
    Sets the x-component of the vector.
   * @param {number} value - The new value for the x-component.
   */
  public override set x(value: number) {
    this.vector[0] = value;
  }
  /**
    Gets the y-component of the vector.
   * @type {number}
   */
  public override get y(): number {
    return this.vector[1];
  }
  /**
    Sets the y-component of the vector.
   * @param {number} value - The new value for the y-component.
   */
  public override set y(value: number) {
    this.vector[1] = value;
  }
  /**
    Gets the z-component of the vector.
   * @type {number}
   */
  public get z(): number {
    return this.vector[2];
  }
  /**
    Sets the z-component of the vector.
   * @param {number} value - The new value for the z-component.
   */
  public set z(value: number) {
    this.vector[2] = value;
  }

  /**
    Creates an instance of Vector3.
   * @param {number} [x=0] - The x-component.
   * @param {number} [y=0] - The y-component.
   * @param {number} [z=0] - The z-component.
   */
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super(x, y);
    this._vec = vec3.fromValues(x, y, z);
  }

  /**
    Deserializes the vector's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.z = jsonObject["z"];
  }

  /**
    Serializes the vector's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      className: Vector3.className,
      z: this.z,
    };
  }

  /**
    Sets the components of the vector.
   * @override
   * @param {number} [x=0] - The new x-component.
   * @param {number} [y=0] - The new y-component.
   * @param {number} [z=0] - The new z-component.
   * @returns {void}
   */
  override set(x: number = 0, y: number = 0, z: number = 0): void {
    super.set(x, y);
    this.z = z;
  }
}

/**
  A class representing a 4D vector, backed by a gl-matrix vec4.
 * @augments {Vector3}
 */
export class Vector4 extends Vector3 {

  protected override _className = "Vector4"

  /**
    The internal gl-matrix vector.
   * @protected
   * @type {vec4}
   */
  protected override _vec: vec4;

  /**
    Gets the internal gl-matrix vector.
   * @returns {vec4} - The internal vector instance.
   */
  public override get vector(): vec4 {
    return this._vec;
  }

  /**
    Gets the x-component of the vector.
   * @type {number}
   */
  public override get x(): number {
    return this.vector[0];
  }
  /**
    Sets the x-component of the vector.
   * @param {number} value - The new value for the x-component.
   */
  public override set x(value: number) {
    this.vector[0] = value;
  }
  /**
    Gets the y-component of the vector.
   * @type {number}
   */
  public override get y(): number {
    return this.vector[1];
  }
  /**
    Sets the y-component of the vector.
   * @param {number} value - The new value for the y-component.
   */
  public override set y(value: number) {
    this.vector[1] = value;
  }
  /**
    Gets the z-component of the vector.
   * @type {number}
   */
  public override get z(): number {
    return this.vector[2];
  }
  /**
    Sets the z-component of the vector.
   * @param {number} value - The new value for the z-component.
   */
  public override set z(value: number) {
    this.vector[2] = value;
  }
  /**
    Gets the w-component of the vector.
   * @type {number}
   */
  public get w(): number {
    return this.vector[3];
  }
  /**
    Sets the w-component of the vector.
   * @param {number} value - The new value for the w-component.
   */
  public set w(value: number) {
    this.vector[3] = value;
  }

  /**
    Creates an instance of Vector4.
   * @param {number} [x=0] - The x-component.
   * @param {number} [y=0] - The y-component.
   * @param {number} [z=0] - The z-component.
   * @param {number} [w=0] - The w-component.
   */
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    super(x, y, z);
    this._vec = vec4.fromValues(x, y, z, w);
  }

  /**
    Deserializes the vector's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.x = jsonObject["x"];
    this.y = jsonObject["y"];
    this.z = jsonObject["z"];
    this.w = jsonObject["w"];
  }

  /**
    Serializes the vector's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      className: Vector4.className,
      x: this.x,
      y: this.y,
      z: this.z,
      w: this.w,
    };
  }

  /**
    Sets the components of the vector.
   * @override
   * @param {number} [x=0] - The new x-component.
   * @param {number} [y=0] - The new y-component.
   * @param {number} [z=0] - The new z-component.
   * @param {number} [w=0] - The new w-component.
   * @returns {void}
   */
  override set(x: number = 0, y: number = 0, z: number = 0, w: number = 0): void {
    super.set(x, y, z);
    this.w = w;
  }
}
