import { vec2, vec3 } from "gl-matrix";

/**
 * @class MeshData
 * @description Base class for geometric mesh data.
 * It stores vertex positions, normals, and UV coordinates.
 */
export class MeshData {
  public vertices: vec3[];
  public normals: vec3[];
  public uvs: vec2[];
  public indices: number[]; // Optional: For indexed drawing

  /**
   * @constructor
   * @param {vec3[]} vertices - Array of vertex positions.
   * @param {vec3[]} normals - Array of vertex normals.
   * @param {vec2[]} uvs - Array of texture coordinates.
   * @param {number[]} [indices=[]] - Optional array of indices for indexed drawing.
   */
  constructor(vertices: vec3[], normals: vec3[], uvs: vec2[], indices: number[] = []) {
    this.vertices = vertices;
    this.normals = normals;
    this.uvs = uvs;
    this.indices = indices;
  }
}


export class Mesh{
  public meshData!:MeshData;
}

