// src/primitives/TrianglePrimitive.ts

import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class TrianglePrimitive extends MeshData {
  constructor() {
    const vertices: vec3[] = [
      [ 0.0,  1.0, 0.0],
      [-1.0, -1.0, 0.0],
      [ 1.0, -1.0, 0.0]
    ];

    const normals: vec3[] = [
      [0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0]
    ];

    const uvs: vec2[] = [
      [0.5, 1.0],
      [0.0, 0.0],
      [1.0, 0.0]
    ];

    super(vertices, normals, uvs);
  }
}
