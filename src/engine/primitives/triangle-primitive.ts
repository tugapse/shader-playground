import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

/**
  Represents a simple, procedurally generated 2D triangle primitive.
 * This triangle lies on the XY-plane and is centered at the origin.
 * @augments {MeshData}
 */
export class TrianglePrimitive extends MeshData {
  /**
    Creates a new instance of TrianglePrimitive.
   */
  constructor() {
    const vertices: vec3[] = [
      [0.0, 1.0, 0.0], // 0: Top vertex
      [-1.0, -1.0, 0.0], // 1: Bottom-left vertex
      [1.0, -1.0, 0.0] // 2: Bottom-right vertex
    ];

    const normals: vec3[] = [
      [0.0, 0.0, 1.0], // Normal pointing out of the XY plane
      [0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0]
    ];

    const uvs: vec2[] = [
      [0.5, 1.0], // Top center of the texture
      [0.0, 0.0], // Bottom-left of the texture
      [1.0, 0.0] // Bottom-right of the texture
    ];

    // Indices for the single triangle (already in CCW order)
    const indices: number[] = [0, 1, 2];

    super(vertices, normals, uvs, indices);
  }
}