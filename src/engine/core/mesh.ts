
import { vec2, vec3 } from "gl-matrix";

/**
 * @class MeshData
 * @description Base class for geometric mesh data.
 * It stores vertex positions, normals, and UV coordinates, along with optional tangent and bitangent vectors for normal mapping.
 */
export class MeshData {
  public vertices: vec3[];
  public normals: vec3[];
  public uvs: vec2[];
  public indices: number[];
  public tangents?: vec3[];
  public bitangents?: vec3[];

  /**
   * @constructor
   * @param {vec3[]} vertices - Array of vertex positions.
   * @param {vec3[]} normals - Array of vertex normals.
   * @param {vec2[]} uvs - Array of texture coordinates.
   * @param {number[]} [indices=[]] - Optional array of indices for indexed drawing.
   */
  constructor(
    vertices: vec3[],
    normals: vec3[],
    uvs: vec2[],
    indices: number[] = [],
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.uvs = uvs;
    this.indices = indices;
  }

  /**
   * Calculates tangents and bitangents for the mesh and populates the instance's arrays.
   */
  public calculateTangentsAndBitangents(): void {
    if (!this.indices || this.indices.length === 0) {
      console.warn("Cannot calculate tangents/bitangents: Mesh data has no indices.");
      return;
    }

    const tangents = new Array<vec3>(this.vertices.length).fill(vec3.create());
    const bitangents = new Array<vec3>(this.vertices.length).fill(vec3.create());

    for (let i = 0; i < this.indices.length; i += 3) {
      const i1 = this.indices[i];
      const i2 = this.indices[i + 1];
      const i3 = this.indices[i + 2];

      const p1 = this.vertices[i1];
      const p2 = this.vertices[i2];
      const p3 = this.vertices[i3];

      const uv1 = this.uvs[i1];
      const uv2 = this.uvs[i2];
      const uv3 = this.uvs[i3];

      const edge1 = vec3.sub(vec3.create(), p2, p1);
      const edge2 = vec3.sub(vec3.create(), p3, p1);
      const deltaUV1 = vec2.sub(vec2.create(), uv2, uv1);
      const deltaUV2 = vec2.sub(vec2.create(), uv3, uv1);

      const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

      const tangent = vec3.create();
      tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
      tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
      tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
      vec3.normalize(tangent, tangent);

      const bitangent = vec3.create();
      bitangent[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
      bitangent[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
      bitangent[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
      vec3.normalize(bitangent, bitangent);

      vec3.add(tangents[i1], tangents[i1], tangent);
      vec3.add(tangents[i2], tangents[i2], tangent);
      vec3.add(tangents[i3], tangents[i3], tangent);

      vec3.add(bitangents[i1], bitangents[i1], bitangent);
      vec3.add(bitangents[i2], bitangents[i2], bitangent);
      vec3.add(bitangents[i3], bitangents[i3], bitangent);
    }

    for (let i = 0; i < this.vertices.length; ++i) {
      const n = this.normals[i];
      const t = tangents[i];
      vec3.scaleAndAdd(t, t, n, -vec3.dot(n, t));
      vec3.normalize(t, t);
      const b = bitangents[i];
      vec3.cross(b, n, t);
      vec3.normalize(b, b);
    }

    this.tangents = tangents;
    this.bitangents = bitangents;
  }
}

export class Mesh {
  public meshData!: MeshData;
}

