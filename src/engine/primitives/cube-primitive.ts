import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

/**
  Represents a procedurally generated cube primitive with positions, normals, and UV coordinates.
 * @augments {MeshData}
 */
export class CubePrimitive extends MeshData {
  /**
    Creates a new CubePrimitive instance.
    
   * @override
   * @param {vec3[]} [vertices] - Optional initial vertices.
   * @param {vec3[]} [normals] - Optional initial normals.
   * @param {vec2[]} [uvs] - Optional initial UVs.
   * @param {number[]} [indices] - Optional initial indices.
   * @returns {CubePrimitive} - A new CubePrimitive instance.
   */
  public static override instanciate(vertices?: vec3[], normals?: vec3[], uvs?: vec2[], indices?: number[]): CubePrimitive {
    return new CubePrimitive();
  }

  /**
    Creates an instance of CubePrimitive.
   * @param {number} [size=2.0] - The size of the cube.
   */
  constructor(size: number = 2.0) {
    const halfSize = size / 2.0;

    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = [];

    /**
      Adds a single face (two triangles) to the cube's geometry data.
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
      [-halfSize, -halfSize, halfSize],
      [halfSize, -halfSize, halfSize],
      [halfSize, halfSize, halfSize],
      [-halfSize, halfSize, halfSize],
      [0.0, 0.0, 1.0],
      [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
      0 * 4
    );

    // Back face (-Z)
    addFace(
      [-halfSize, halfSize, -halfSize],
      [halfSize, halfSize, -halfSize],
      [halfSize, -halfSize, -halfSize],
      [-halfSize, -halfSize, -halfSize],
      [0.0, 0.0, -1.0],
      [0.0, 1.0], [0.0, 0.0], [1.0, 0.0], [1.0, 1.0],
      1 * 4
    );

    // Top face (+Y)
    addFace(
      [-halfSize, halfSize, halfSize],
      [halfSize, halfSize, halfSize],
      [halfSize, halfSize, -halfSize],
      [-halfSize, halfSize, -halfSize],
      [0.0, 1.0, 0.0],
      [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0],
      2 * 4
    );

    // Bottom face (-Y)
    addFace(
      [-halfSize, -halfSize, -halfSize],
      [halfSize, -halfSize, -halfSize],
      [halfSize, -halfSize, halfSize],
      [-halfSize, -halfSize, halfSize],
      [0.0, -1.0, 0.0],
      [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0],
      3 * 4
    );

    // Right face (+X)
    addFace(
      [halfSize, -halfSize, halfSize],
      [halfSize, -halfSize, -halfSize],
      [halfSize, halfSize, -halfSize],
      [halfSize, halfSize, halfSize],
      [1.0, 0.0, 0.0],
      [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
      4 * 4
    );

    // Left face (-X)
    addFace(
      [-halfSize, -halfSize, -halfSize],
      [-halfSize, -halfSize, halfSize],
      [-halfSize, halfSize, halfSize],
      [-halfSize, halfSize, -halfSize],
      [-1.0, 0.0, 0.0],
      [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
      5 * 4
    );

    super(vertices, normals, uvs, indices);
  }
}