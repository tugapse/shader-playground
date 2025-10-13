import { vec2, vec3 } from "gl-matrix";
import { CubePrimitive } from "./cube-primitive";

/**
  Represents a cube primitive specifically used for a skybox.
 * It extends the base CubePrimitive class but is typically used with a different shader and rendering state (e.g., culling the inside faces).
 * @augments {CubePrimitive}
 */
export class SkyboxPrimitive extends CubePrimitive {
  /**
    Creates a new SkyboxPrimitive instance.
    
   * @override
   * @param {vec3[]} [vertices] - Optional initial vertices.
   * @param {vec3[]} [normals] - Optional initial normals.
   * @param {vec2[]} [uvs] - Optional initial UVs.
   * @param {number[]} [indices] - Optional initial indices.
   * @returns {CubePrimitive} - A new SkyboxPrimitive instance.
   */
  public static override instanciate(vertices?: vec3[], normals?: vec3[], uvs?: vec2[], indices?: number[]): CubePrimitive {
    return new SkyboxPrimitive();
  }

  /**
    Creates an instance of SkyboxPrimitive.
   * @param {number} [size=2.0] - The size of the skybox cube.
   */
  constructor(size: number = 2.0) {
    super(size);
  }
}