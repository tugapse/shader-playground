import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

/**
  Represents a procedurally generated plane primitive composed of a grid of vertices.
 * @augments {MeshData}
 */
export class PlanePrimitive extends MeshData {
  /**
    Creates a new instance of a PlanePrimitive.
   * This constructor generates a square plane mesh with the specified resolution. The plane is centered at the origin (0,0,0) and lies on the XZ-plane.
   * @param {number} [resolution=1] - The number of segments per side. A higher resolution results in more vertices and a denser mesh. Must be at least 1.
   */
  constructor(resolution: number = 1) {
    // Ensure resolution is at least 1 and an integer.
    resolution = Math.max(1, Math.floor(resolution));

    const size = resolution;
    const halfSize = size / 2.0;
    const segmentSize = 1.0;

    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = [];

    // Generate vertices, normals, and UVs for the grid.
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = -halfSize + j * segmentSize;
        const z = -halfSize + i * segmentSize;

        vertices.push(vec3.fromValues(x, 0.0, z));
        normals.push(vec3.fromValues(0.0, 1.0, 0.0));
        uvs.push(vec2.fromValues(j / resolution, i / resolution));
      }
    }

    // Generate indices for the triangles.
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const baseIndex = i * (resolution + 1) + j;

        // Triangle 1 (bottom-left, top-left, top-right)
        indices.push(
          baseIndex,
          baseIndex + (resolution + 1),
          baseIndex + (resolution + 1) + 1
        );

        // Triangle 2 (bottom-left, top-right, bottom-right)
        indices.push(
          baseIndex,
          baseIndex + (resolution + 1) + 1,
          baseIndex + 1
        );
      }
    }

    super(vertices, normals, uvs, indices);
  }
}