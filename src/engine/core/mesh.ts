
import { vec2, vec3 } from "gl-matrix";
import { EngineCache } from "./storage";


export const createTorusPrimitive = async () => {
  return EngineCache.getMeshDataFromObj("assets/primitives/torus.obj");
}
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

    // FIX: Initialize arrays with unique vec3 instances
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
      // A common value for epsilon in graphics is 1e-6 (0.000001) or 1e-7.
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
}
export class Mesh {
  public meshData!: MeshData;
}

