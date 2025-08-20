import { vec2, vec3 } from "gl-matrix";
import { EngineCache } from "./storage"; // Assuming these imports are necessary for other parts of the class.
import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { v4 as uuidv4 } from 'uuid'
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";


export const createTorusPrimitive = async () => {
  return EngineCache.getMeshDataFromObj("assets/primitives/torus.obj");
}
export const createcilinderPrimitive = async () => {
  return EngineCache.getMeshDataFromObj("assets/primitives/cilinder.obj");
}

/**
 * @class MeshData
 * @description Base class for geometric mesh data.
 * It stores vertex positions, normals, and UV coordinates, along with optional tangent and bitangent vectors for normal mapping.
 */
export class MeshData implements JsonSerializable {
  public static instanciate(vertices?: vec3[], normals: vec3[] = [], uvs: vec2[] = [], indices: number[] = []) {
    if (!vertices) vertices = [];
    return new MeshData(vertices, normals, uvs, indices)
  }
  public vertices: vec3[];
  public normals: vec3[];
  public uvs: vec2[];
  public indices: number[];

  public tangents?: vec3[];
  public bitangents?: vec3[];
  private _uuid: string;
  public get uuid(): string { return this._uuid }


  constructor(
    vertices: vec3[],
    normals: vec3[] = [], // Make normals optional in constructor, as they can be generated
    uvs: vec2[] = [],     // Make uvs optional in constructor
    indices: number[] = [],
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.uvs = uvs;
    this.indices = indices;
    this._uuid = uuidv4();
  }

  /**
   * Calculates smooth normals and generates indices for the mesh based on its vertices. 📐
   * If `this.indices` is not already set, it generates sequential indices assuming the vertices
   * are ordered to form triangles (e.g., 3 vertices per triangle).
   * It computes face normals and then averages them for vertex normals to create a smooth appearance.
   * The calculated normals and indices are stored directly in `this.normals` and `this.indices`.
   */
  public calculateNormals(): void {
    if (this.vertices.length === 0) {
      console.warn("Cannot calculate normals/indices: Mesh data has no vertices.");
      return;
    }

    const numVertices = this.vertices.length;

    // Initialize normals array with zero vectors
    this.normals = Array.from({ length: numVertices }, () => vec3.create());

    // Initialize arrays to store the sum of face normals for each vertex
    // and a counter for how many faces contribute to each vertex's normal.
    // Using vec3.create() for sums to leverage gl-matrix operations directly.
    const vertexNormalSums = Array.from({ length: numVertices }, () => vec3.create());
    const vertexNormalCounts = new Array(numVertices).fill(0);

    // Iterate through triangles using indices
    // We step by 3 because each triangle uses 3 indices.
    for (let i = 0; i < this.indices.length; i += 3) {
      const i1 = this.indices[i];
      const i2 = this.indices[i + 1];
      const i3 = this.indices[i + 2];

      // Ensure indices are valid to prevent out-of-bounds access
      if (i1 >= numVertices || i2 >= numVertices || i3 >= numVertices) {
        console.warn(`Invalid index found in triangle ${Math.floor(i / 3)}: [${i1}, ${i2}, ${i3}]. Skipping triangle.`);
        continue; // Skip to the next triangle
      }

      const p1 = this.vertices[i1];
      const p2 = this.vertices[i2];
      const p3 = this.vertices[i3];

      // Calculate two edges of the triangle using gl-matrix vec3 functions
      const edge1 = vec3.sub(vec3.create(), p2, p1);
      const edge2 = vec3.sub(vec3.create(), p3, p1);

      // Calculate the cross product to get the face normal
      const faceNormal = vec3.create();
      vec3.cross(faceNormal, edge1, edge2);
      vec3.normalize(faceNormal, faceNormal); // Normalize the face normal

      // Add this face normal to the sum for each of the three vertices of the triangle
      vec3.add(vertexNormalSums[i1], vertexNormalSums[i1], faceNormal);
      vertexNormalCounts[i1]++;

      vec3.add(vertexNormalSums[i2], vertexNormalSums[i2], faceNormal);
      vertexNormalCounts[i2]++;

      vec3.add(vertexNormalSums[i3], vertexNormalSums[i3], faceNormal);
      vertexNormalCounts[i3]++;
    }

    // Average the accumulated face normals for each vertex to get the smooth vertex normals
    for (let i = 0; i < numVertices; i++) {
      const sumNormal = vertexNormalSums[i];
      const count = vertexNormalCounts[i];

      if (count > 0) {
        // Divide the sum by the count to get the average, then normalize
        vec3.scale(this.normals[i], sumNormal, 1 / count);
        vec3.normalize(this.normals[i], this.normals[i]);
      } else {
        // If a vertex is not part of any triangle (e.g., isolated vertex), set its normal to zero vector
        vec3.set(this.normals[i], 0, 0, 0);
      }
    }
  }

  /**
   * Inverts the direction of all normal vectors in the mesh. 🔄
   * This is useful for flipping faces or correcting normal orientations.
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
   * Calculates tangents and bitangents for the mesh and populates the instance's arrays.
   * This method should be called after the mesh's vertices, normals, UVs, and indices are set.
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

    // Initialize arrays with unique vec3 instances
    const tangents = Array.from({ length: this.vertices.length }, () => vec3.create());
    const bitangents = Array.from({ length: this.vertices.length }, () => vec3.create());

    // Iterate over each triangle (3 indices)
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

      // Calculate triangle edges in 3D space
      const edge1 = vec3.sub(vec3.create(), p2, p1);
      const edge2 = vec3.sub(vec3.create(), p3, p1);

      // Calculate UV deltas for the triangle
      const deltaUV1 = vec2.sub(vec2.create(), uv2, uv1);
      const deltaUV2 = vec2.sub(vec2.create(), uv3, uv1);

      // Calculate the determinant of the UV matrix
      const denom = (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

      // Relax the epsilon for the determinant check
      const EPSILON = 0.000001;
      const f = (Math.abs(denom) < EPSILON) ? 0.0 : 1.0 / denom;

      const tangent = vec3.create();
      tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
      tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
      tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
      // Note: Normalization will happen later after summing

      const bitangent = vec3.create();
      bitangent[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
      bitangent[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
      bitangent[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
      // Note: Normalization will happen later after summing

      // Accumulate tangents and bitangents for each vertex.
      // Vertices shared by multiple triangles will have their tangents/bitangents averaged out.
      vec3.add(tangents[i1], tangents[i1], tangent);
      vec3.add(tangents[i2], tangents[i2], tangent);
      vec3.add(tangents[i3], tangents[i3], tangent);

      vec3.add(bitangents[i1], bitangents[i1], bitangent);
      vec3.add(bitangents[i2], bitangents[i2], bitangent);
      vec3.add(bitangents[i3], bitangents[i3], bitangent);
    }

    // After summing, orthogonalize and normalize the final vectors for each vertex
    for (let i = 0; i < this.vertices.length; ++i) {
      const n = this.normals[i]; // Original vertex normal
      const t = tangents[i];     // Accumulated tangent

      // Gram-Schmidt orthogonalization: make tangent orthogonal to normal
      vec3.scaleAndAdd(t, t, n, -vec3.dot(n, t));
      vec3.normalize(t, t); // Normalize the tangent

      // Recalculate bitangent using cross product of normal and tangent
      // This ensures that the TBN frame is truly orthogonal.
      const b = bitangents[i]; // Accumulated bitangent (used as starting point for direction)
      vec3.cross(b, n, t); // B = N x T
      vec3.normalize(b, b); // Normalize the bitangent

      // If you find that your normal maps are inverted for specific models (e.g., Blender default tangent space),
      // you might need to re-introduce a conditional negation here based on the model source:
      // if (modelRequiresBitangentFlip) {
      //    vec3.scale(b, b, -1.0);
      // }
    }

    // Assign the calculated arrays to the MeshData instance
    this.tangents = tangents;
    this.bitangents = bitangents;
  }

  toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      uuid: this.uuid,
      vertices: this.vertices.flat(1),
      normals: this.normals.flat(1),
      uvs: this.uvs.flat(1),
      indices: this.indices || [],
      tangents: this.tangents?.flat(1) || [],
      bitangents: this.bitangents?.flat(1) || [],
    }
  }

  fromJson(jsonObject: any): void {
    this._uuid = this.uuid;
    this.vertices = jsonObject.vertices;
    this.normals = jsonObject.normals;
    this.uvs = jsonObject.uvs;
    this.indices = jsonObject.indices;
    this.tangents = jsonObject.tangents;
    this.bitangents = jsonObject.bitangents;
  }
}

export class Mesh implements JsonSerializable {

  public meshData!: MeshData;

  toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      meshDataId: this.meshData.uuid,
    }
  }

  fromJson(jsonObject: JsonSerializedData): void {
    if (!this.meshData) this.meshData = new MeshData([]);
    this.meshData.fromJson(jsonObject);
  }
}
