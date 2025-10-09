import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

/**
  Represents a procedurally generated sphere primitive with positions, normals, and UV coordinates.
 * @augments {MeshData}
 */
export class SpherePrimitive extends MeshData {
  /**
    Creates a new instance of SpherePrimitive.
   * This constructor generates a sphere mesh by creating a grid of vertices using spherical coordinates.
   * @param {number} [radius=1.0] - The radius of the sphere.
   * @param {number} [slices=32] - The number of vertical segments (longitude lines).
   * @param {number} [stacks=16] - The number of horizontal segments (latitude lines).
   */
  constructor(radius: number = 1.0, slices: number = 32, stacks: number = 16) {
    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = [];

    // Generate vertices, normals, and UVs.
    for (let i = 0; i <= stacks; ++i) {
      const v = i / stacks;
      const phi = v * Math.PI;

      for (let j = 0; j <= slices; ++j) {
        const u = j / slices;
        const theta = u * 2 * Math.PI;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        vertices.push([x, y, z]);

        const normalVec = vec3.fromValues(x, y, z);
        vec3.normalize(normalVec, normalVec);
        normals.push(Array.from(normalVec) as vec3);

        uvs.push([u, v]);
      }
    }

    // Generate triangle indices with corrected winding order.
    for (let i = 0; i < stacks; ++i) {
      for (let j = 0; j < slices; ++j) {
        const first = (i * (slices + 1)) + j;
        const second = first + slices + 1;

        // Forms a quad from two triangles with counter-clockwise winding.
        // Triangle 1 (first, first+1, second)
        indices.push(first, first + 1, second);
        // Triangle 2 (first+1, second+1, second)
        indices.push(first + 1, second + 1, second);
      }
    }

    super(vertices, normals, uvs, indices);
  }
}