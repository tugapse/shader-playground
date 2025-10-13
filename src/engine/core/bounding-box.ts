import { JsonSerializable } from "./json-serializable";

/**
 * Represents a 3D bounding box defined by its minimum and maximum coordinates.
 */
export class BoundingBox extends JsonSerializable {
  /**
   * Creates an instance of BoundingBox.
   * @param {number} min_x - The minimum x-coordinate of the bounding box.
   * @param {number} max_x - The maximum x-coordinate of the bounding box.
   * @param {number} min_y - The minimum y-coordinate of the bounding box.
   * @param {number} max_y - The maximum y-coordinate of the bounding box.
   * @param {number} min_z - The minimum z-coordinate of the bounding box.
   * @param {number} max_z - The maximum z-coordinate of the bounding box.
   */
  constructor(

    public min_x: number,
    public max_x: number,
    public min_y: number,
    public max_y: number,
    public min_z: number,
    public max_z: number
  ) {
    super("BoundingBox");
  }

  /**
   * Gets the width of the bounding box.
   */
  get width(): number {
    return this.max_x - this.min_x;
  }

  /**
   * Gets the height of the bounding box.
   */
  get height(): number {
    return this.max_y - this.min_y;
  }

  /**
   * Gets the depth of the bounding box.
   */
  get depth(): number {
    return this.max_z - this.min_z;
  }

}

/**
 * Represents a 3D bounding sphere defined by its center and radius.
 */
export class BoundingSphere extends JsonSerializable {
  /**
   * Creates an instance of BoundingSphere.
   * @param {number} x - The x-coordinate of the center of the sphere.
   * @param {number} y - The y-coordinate of the center of the sphere.
   * @param {number} z - The z-coordinate of the center of the sphere.
   * @param {number} radius - The radius of the sphere.
   */
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public radius: number
  ) {
    super("BoundingSphere");
  }
}
