import { vec3, vec4 } from "gl-matrix";
import { JsonSerializable } from "./json-serializable";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";

/**
 * A class representing a color using RGBA values, backed by a gl-matrix vec4.
 * This class provides methods for manipulating and converting colors.
 * @augments {JsonSerializable}
 */
export class Color extends JsonSerializable {

  public static get className() { return "Color"; }
  /**
   * Creates a new Color instance from a JSON data object.
   * @param {JsonSerializedData} jsonData - The JSON object to deserialize from.
   * @returns {Color} - A new Color instance.
   */
  public static createFromJsonData(jsonData: JsonSerializedData): Color {
    const color = new Color();
    color.fromJson(jsonData);
    return color;
  }

  /**
   * The internal vector storing the color components.
   * @private
   * @type {vec4}
   */
  private vector: vec4;

  /**
   * Gets the red component of the color.
   * @type {number}
   */
  public get r(): number {
    return this.vector[0];
  }
  /**
   * Sets the red component of the color.
   * @param {number} value - The new red value.
   */
  public set r(value: number) {
    this.vector[0] = value;
  }

  /**
   * Gets the green component of the color.
   * @type {number}
   */
  public get g(): number {
    return this.vector[1];
  }
  /**
   * Sets the green component of the color.
   * @param {number} value - The new green value.
   */
  public set g(value: number) {
    this.vector[1] = value;
  }

  /**
   * Gets the blue component of the color.
   * @type {number}
   */
  public get b(): number {
    return this.vector[2];
  }
  /**
   * Sets the blue component of the color.
   * @param {number} value - The new blue value.
   */
  public set b(value: number) {
    this.vector[2] = value;
  }

  /**
   * Gets the alpha component of the color.
   * @type {number}
   */
  public get a(): number {
    return this.vector[3];
  }
  /**
   * Sets the alpha component of the color.
   * @param {number} value - The new alpha value.
   */
  public set a(value: number) {
    this.vector[3] = value;
  }

  /**
   * Creates an instance of Color.
   * @param {number} [r=1] - The red component.
   * @param {number} [g=1] - The green component.
   * @param {number} [b=1] - The blue component.
   * @param {number} [a=1] - The alpha component.
   */
  constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
    super("Color");
    this.vector = vec4.fromValues(r, g, b, a);
  }

  /**
   * Serializes the color's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a,
    };
  }

  /**
   * Deserializes the color's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    this.r = jsonObject["r"];
    this.g = jsonObject["g"];
    this.b = jsonObject["b"];
    this.a = jsonObject["a"];
  }

  /**
   * Converts the color to a gl-matrix vec3.
   * @returns {vec3} - A new vec3 containing the RGB components.
   */
  public toVec3(): vec3 {
    return vec3.fromValues(this.r, this.g, this.b);
  }

  /**
   * Returns the internal gl-matrix vec4.
   * @returns {vec4} - The vec4 containing the RGBA components.
   */
  public toVec4(): vec4 {
    return this.vector;
  }

  /**
   * Creates a new Color instance with the same values.
   * @returns {Color} - A cloned Color instance.
   */
  public clone(): Color {
    return new Color(...this.vector);
  }

  /**
   * Sets the RGBA values of the color.
   * @param {number} [r=1] - The red component.
   * @param {number} [g=1] - The green component.
   * @param {number} [b=1] - The blue component.
   * @param {number} [a=1] - The alpha component.
   */
  public set(r: number = 1, g: number = 1, b: number = 1, a: number = 1): void {
    this.vector[0] = r;
    this.vector[1] = g;
    this.vector[2] = b;
    this.vector[3] = a;
  }
}