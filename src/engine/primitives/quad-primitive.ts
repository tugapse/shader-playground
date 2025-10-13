import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

/**
  Represents a procedurally generated quad (square) primitive with positions, normals, and UV coordinates.
 * @augments {MeshData}
 */
export class QuadPrimitive extends MeshData {
  /**
    Creates a new instance of QuadPrimitive.
   * This constructor generates a single square plane mesh. The quad is centered at the origin (0,0,0) and lies on the XY-plane.
   * @param {number} [size=2.0] - The side length of the quad.
   */
  constructor(size: number = 2.0) {
    const halfSize = size / 2.0;

    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = [];

    /**
      Adds a single face (two triangles) to the quad's geometry data.
     * @param {vec3} v0 - The first vertex of the face.
     * @param {vec3} v1 - The second vertex of the face.
     * @param {vec3} v2 - The third vertex of the face.
     * @param {vec3} v3 - The fourth vertex of the face.
     * @param {vec3} normal - The normal vector for the face.
     * @param {vec2} uv0 - The first UV coordinate.
     * @param {vec2} uv1 - The second UV coordinate.
     * @param {vec2} uv2 - The third UV coordinate.
     * @param {vec2} uv3 - The fourth UV coordinate.
     * @param {number} baseIndex - The starting index for the face's indices.
     * @returns {void}
     */
    const addFace = (
      v0: vec3, v1: vec3, v2: vec3, v3: vec3,
      normal: vec3,
      uv0: vec2, uv1: vec2, uv2: vec2, uv3: vec2,
      baseIndex: number
    ): void => {
      vertices.push(v0, v1, v2, v3);
      normals.push(normal, normal, normal, normal);
      uvs.push(uv0, uv1, uv2, uv3);

      indices.push(
        baseIndex + 0, baseIndex + 1, baseIndex + 2,
        baseIndex + 0, baseIndex + 2, baseIndex + 3
      );
    };

    // Front face (+Z)
    addFace(
      [-halfSize, -halfSize, 0],
      [halfSize, -halfSize, 0],
      [halfSize, halfSize, 0],
      [-halfSize, halfSize, 0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
      0 * 4
    );

    super(vertices, normals, uvs, indices);
  }
}