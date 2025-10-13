import { vec2, vec3 } from "gl-matrix";
import { v4 as uuidv4 } from 'uuid';
import { JsonSerializable } from "./json-serializable";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { IMeshData } from "../interfaces/meshData.interface";
import { BoundingBox, BoundingSphere } from "./bounding-box";

/**
  Base class for geometric mesh data. It stores vertex positions, normals, and UV coordinates, along with optional tangent and bitangent vectors for normal mapping.
 * @augments {JsonSerializable}
 */
export class MeshData extends JsonSerializable implements IMeshData {

  /**
    Creates a new MeshData instance.

   * @param {vec3[]} [vertices] - The array of vertex positions.
   * @param {vec3[]} [normals=[]] - The array of vertex normals.
   * @param {vec2[]} [uvs=[]] - The array of texture coordinates.
   * @param {number[]} [indices=[]] - The array of vertex indices.
   * @returns {MeshData} - A new MeshData instance.
   */
  public static instanciate(vertices?: vec3[], normals: vec3[] = [], uvs: vec2[] = [], indices: number[] = []): MeshData {
    if (!vertices) vertices = [];
    return new MeshData(vertices, normals, uvs, indices);
  }

  /**
    The array of vertex positions.
   * @type {vec3[]}
   */
  public vertices: vec3[];
  /**
    The array of vertex normals.
   * @type {vec3[]}
   */
  public normals: vec3[];
  /**
    The array of texture coordinates.
   * @type {vec2[]}
   */
  public uvs: vec2[];
  /**
    The array of vertex indices.
   * @type {number[]}
   */
  public indices: number[];
  /**
    The array of tangent vectors.
   * @type {vec3[] | undefined}
   */
  public tangents?: vec3[];
  /**
    The array of bitangent vectors.
   * @type {vec3[] | undefined}
   */
  public bitangents?: vec3[];
  /**
    The unique identifier for the mesh data.
   * @type {string}
   */

  /**
    Creates an instance of MeshData.
   * @param {vec3[]} vertices - The array of vertex positions.
   * @param {vec3[]} [normals=[]] - The array of vertex normals.
   * @param {vec2[]} [uvs=[]] - The array of texture coordinates.
   * @param {number[]} [indices=[]] - The array of vertex indices.
   */
  constructor(vertices: vec3[], normals: vec3[] = [], uvs: vec2[] = [], indices: number[] = []) {
    super("MeshData");
    this.vertices = vertices;
    this.normals = normals;
    this.uvs = uvs;
    this.indices = indices;
  }

  /**
    Calculates smooth normals and generates indices for the mesh based on its vertices.
   * It computes face normals and then averages them for vertex normals to create a smooth appearance.
   * The calculated normals and indices are stored directly in `this.normals` and `this.indices`.
   * @returns {void}
   */
  public calculateNormals(): void {
    if (this.vertices.length === 0) {
      console.warn("Cannot calculate normals/indices: Mesh data has no vertices.");
      return;
    }

    const numVertices = this.vertices.length;

    this.normals = Array.from({ length: numVertices }, () => vec3.create());

    const vertexNormalSums = Array.from({ length: numVertices }, () => vec3.create());
    const vertexNormalCounts = new Array(numVertices).fill(0);

    for (let i = 0; i < this.indices.length; i += 3) {
      const i1 = this.indices[i];
      const i2 = this.indices[i + 1];
      const i3 = this.indices[i + 2];

      if (i1 >= numVertices || i2 >= numVertices || i3 >= numVertices) {
        console.warn(`Invalid index found in triangle ${Math.floor(i / 3)}: [${i1}, ${i2}, ${i3}]. Skipping triangle.`);
        continue;
      }

      const p1 = this.vertices[i1];
      const p2 = this.vertices[i2];
      const p3 = this.vertices[i3];

      const edge1 = vec3.sub(vec3.create(), p2, p1);
      const edge2 = vec3.sub(vec3.create(), p3, p1);

      const faceNormal = vec3.create();
      vec3.cross(faceNormal, edge1, edge2);
      vec3.normalize(faceNormal, faceNormal);

      vec3.add(vertexNormalSums[i1], vertexNormalSums[i1], faceNormal);
      vertexNormalCounts[i1]++;

      vec3.add(vertexNormalSums[i2], vertexNormalSums[i2], faceNormal);
      vertexNormalCounts[i2]++;

      vec3.add(vertexNormalSums[i3], vertexNormalSums[i3], faceNormal);
      vertexNormalCounts[i3]++;
    }

    for (let i = 0; i < numVertices; i++) {
      const sumNormal = vertexNormalSums[i];
      const count = vertexNormalCounts[i];

      if (count > 0) {
        vec3.scale(this.normals[i], sumNormal, 1 / count);
        vec3.normalize(this.normals[i], this.normals[i]);
      } else {
        vec3.set(this.normals[i], 0, 0, 0);
      }
    }
  }

  /**
 * Calculates the bounding box for this mesh using its internal vertices.
 *
 * @returns A BoundingBox object, or null if the mesh has no vertices.
 */
  static getBoundingBox(vertices: vec3[]): BoundingBox | null {
    if (vertices.length === 0) {
      return null;
    }

    // Initialize min and max values with the first vertex
    let min_x = vertices[0][0];
    let max_x = vertices[0][0];
    let min_y = vertices[0][1];
    let max_y = vertices[0][1];
    let min_z = vertices[0][2];
    let max_z = vertices[0][2];

    // Iterate through each vertex array
    for (const vertex of vertices) {
      const x = vertex[0];
      const y = vertex[1];
      const z = vertex[2];

      // Update min and max values
      min_x = Math.min(min_x, x);
      max_x = Math.max(max_x, x);
      min_y = Math.min(min_y, y);
      max_y = Math.max(max_y, y);
      min_z = Math.min(min_z, z);
      max_z = Math.max(max_z, z);
    }

    return new BoundingBox(min_x, max_x, min_y, max_y, min_z, max_z);
  }

  /**
   * Calculates a bounding sphere for this mesh using its internal vertices.
   * The sphere's center is the mesh's centroid.
   *
   * @returns A BoundingSphere object, or null if the mesh has no vertices.
   */
  static getBoundingSphere(vertices: vec3[]): BoundingSphere | null {
    if (vertices.length === 0) {
      return null;
    }

    // First, calculate the centroid of the mesh
    let sum_x = 0;
    let sum_y = 0;
    let sum_z = 0;
    for (const vertex of vertices) {
      sum_x += vertex[0];
      sum_y += vertex[1];
      sum_z += vertex[2];
    }
    const numVertices = vertices.length;
    const center_x = sum_x / numVertices;
    const center_y = sum_y / numVertices;
    const center_z = sum_z / numVertices;

    // Then, find the maximum distance from the centroid to any vertex
    let max_radius_squared = 0;
    for (const vertex of vertices) {
      const dx = vertex[0] - center_x;
      const dy = vertex[1] - center_y;
      const dz = vertex[2] - center_z;
      const distance_squared = dx * dx + dy * dy + dz * dz;
      max_radius_squared = Math.max(max_radius_squared, distance_squared);
    }
    const radius = Math.sqrt(max_radius_squared);

    return new BoundingSphere(center_x, center_y, center_z, radius);
  }


  /**
    Inverts the direction of all normal vectors in the mesh.
   * This is useful for flipping faces or correcting normal orientations.
   * @returns {void}
   */
  public invertNormals(): void {
    if (this.normals.length === 0) {
      console.warn("No normals to invert: The normals array is empty.");
      return;
    }

    for (let i = 0; i < this.normals.length; i++) {
      vec3.negate(this.normals[i], this.normals[i]);
    }
    console.log("Normals inverted successfully.");
  }

  /**
    Calculates tangents and bitangents for the mesh and populates the instance's arrays.
   * This method should be called after the mesh's vertices, normals, UVs, and indices are set.
   * @returns {void}
   */
  public calculateTangentsAndBitangents(): void {
    if (!this.indices || this.indices.length === 0) {
      console.warn("Cannot calculate tangents/bitangents: Mesh data has no indices.");
      return;
    }
    if (!this.uvs || this.uvs.length === 0) {
      console.warn("Cannot calculate tangents/bitangents: Mesh data has no UVs.");
      return;
    }
    if (!this.normals || this.normals.length === 0) {
      console.warn("Cannot calculate tangents/bitangents: Mesh data has no normals.");
      return;
    }

    const tangents = Array.from({ length: this.vertices.length }, () => vec3.create());
    const bitangents = Array.from({ length: this.vertices.length }, () => vec3.create());

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

      const denom = deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1];

      const EPSILON = 0.000001;
      const f = Math.abs(denom) < EPSILON ? 0.0 : 1.0 / denom;

      const tangent = vec3.create();
      tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
      tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
      tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);

      const bitangent = vec3.create();
      bitangent[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
      bitangent[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
      bitangent[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);

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

  /**
    Serializes the mesh data to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      uuid: this.uuid,
      vertices: this.vertices,
      normals: this.normals,
      uvs: this.uvs,
      indices: this.indices || [],
      tangents: this.tangents || [],
      bitangents: this.bitangents || [],
    };
  }

  /**
    Deserializes the mesh data from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.vertices = jsonObject["vertices"];
    this.normals = jsonObject["normals"];
    this.uvs = jsonObject["uvs"];
    this.indices = jsonObject["indices"];
    this.tangents = jsonObject["tangents"];
    this.bitangents = jsonObject["bitangents"];
  }
}

/**
  A class that holds a reference to shared mesh data.
 * @augments {JsonSerializable}
 */
export class Mesh extends JsonSerializable {
  constructor() {
    super("Mesh");
  }
  /**
    The shared mesh data instance.
   * @type {MeshData}
   */
  public meshData!: MeshData;

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      meshData: this.meshData.toJsonObject()
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.meshData = new MeshData([]);
    this.meshData.fromJson(jsonObject["meshData"]);
  }

}
