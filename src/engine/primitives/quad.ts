// src/primitives/QuadPrimitive.ts

import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class QuadPrimitive extends MeshData {
  constructor(size: number = 2.0) {
      const halfSize = size / 2.0;

    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = [];

    const addFace = (
      v0: vec3, v1: vec3, v2: vec3, v3: vec3,
      normal: vec3,
      uv0: vec2, uv1: vec2, uv2: vec2, uv3: vec2,
      baseIndex: number
    ) => {
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
      [ halfSize, -halfSize, 0],
      [ halfSize,  halfSize, 0],
      [-halfSize,  halfSize, 0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
      0 * 4
    );


    super(vertices, normals, uvs, indices);
  }
}
