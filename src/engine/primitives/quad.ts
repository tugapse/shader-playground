// src/primitives/QuadPrimitive.ts

import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class QuadPrimitive extends MeshData {
  constructor(width: number = 2.0, height: number = 2.0) {
    const hw = width / 2.0;
    const hh = height / 2.0;

    const vertices: vec3[] = [
      [-hw, -hh, 0.0],
      [ hw, -hh, 0.0],
      [-hw,  hh, 0.0],

      [-hw,  hh, 0.0],
      [ hw, -hh, 0.0],
      [ hw,  hh, 0.0]
    ];

    const normals: vec3[] = [
      [0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]
    ];

    const uvs: vec2[] = [
      [0.0, 0.0],
      [1.0, 0.0],
      [0.0, 1.0],

      [0.0, 1.0],
      [1.0, 0.0],
      [1.0, 1.0]
    ];

    super(vertices, normals, uvs);
  }
}
