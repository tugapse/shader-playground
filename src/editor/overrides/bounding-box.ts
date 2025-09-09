import { JsonSerializable } from "omega-game-engine";

/**
 * Represents a 3D bounding box defined by its minimum and maximum coordinates.
 */
export class BoundingBox extends JsonSerializable {
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
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public radius: number
  ) {
    super("BoundingSphere");
  }
}
