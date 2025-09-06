/**
 * Represents a 3D bounding box defined by its minimum and maximum coordinates.
 */
export class BoundingBox {
  constructor(
    public min_x: number,
    public max_x: number,
    public min_y: number,
    public max_y: number,
    public min_z: number,
    public max_z: number
  ) {}

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

  /**
   * Returns a string representation of the bounding box's dimensions.
   */
  getDimensions(): string {
    return `Width: ${this.width}, Height: ${this.height}, Depth: ${this.depth}`;
  }
}

/**
 * Represents a 3D bounding sphere defined by its center and radius.
 */
export class BoundingSphere {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public radius: number
  ) {}

  /**
   * Returns a string representation of the bounding sphere's properties.
   */
  toString(): string {
    return `Center: (${this.x}, ${this.y}, ${this.z}), Radius: ${this.radius}`;
  }
}
