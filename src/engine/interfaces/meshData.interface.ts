import { vec2, vec3 } from "gl-matrix";
import { JsonSerializable } from "../core/json-serializable";
import { JsonSerializedData } from "./json-serialized-data.interface";

/**
 * Interface for geometric mesh data. It defines the structure for storing
 * vertex positions, normals, and UV coordinates, along with optional
 * tangent and bitangent vectors for normal mapping.
 *
 * @augments {JsonSerializable}
 */
export interface IMeshData extends JsonSerializable {
  /**
   * The array of vertex positions.
   * @type {vec3[]}
   */
  vertices: vec3[];

  /**
   * The array of vertex normals.
   * @type {vec3[]}
   */
  normals: vec3[];

  /**
   * The array of texture coordinates.
   * @type {vec2[]}
   */
  uvs: vec2[];

  /**
   * The array of vertex indices.
   * @type {number[]}
   */
  indices: number[];

  /**
   * The array of tangent vectors.
   * @type {vec3[] | undefined}
   */
  tangents?: vec3[];

  /**
   * The array of bitangent vectors.
   * @type {vec3[] | undefined}
   */
  bitangents?: vec3[];

  /**
   * The unique identifier for the mesh data.
   * @type {string}
   */
  uuid: string;

  /**
   * Calculates smooth normals for the mesh based on its vertices and indices.
   * @returns {void}
   */
  calculateNormals(): void;

  /**
   * Inverts the direction of all normal vectors in the mesh.
   * @returns {void}
   */
  invertNormals(): void;

  /**
   * Calculates tangents and bitangents for the mesh.
   * @returns {void}
   */
  calculateTangentsAndBitangents(): void;
}
