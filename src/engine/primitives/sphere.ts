// src/primitives/SpherePrimitive.ts

import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";

export class SpherePrimitive extends MeshData {
  constructor(radius: number = 1.0, slices: number = 32, stacks: number = 16) {
    const vertices: vec3[] = [];
    const normals: vec3[] = [];
    const uvs: vec2[] = [];
    const indices: number[] = []; // for triangles

    for (let i = 0; i <= stacks; ++i) {
      const v = i / stacks;
      const phi = v * Math.PI;

      for (let j = 0; j <= slices; ++j) {
        const u = j / slices;
        const theta = u * 2 * Math.PI;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        vertices.push([x, y, z]);

        const normalVec = vec3.fromValues(x, y, z);
        vec3.normalize(normalVec, normalVec);
        normals.push(Array.from(normalVec) as vec3);

        uvs.push([u, v]);
      }
    }

    // Generate triangle indices with corrected winding order
    for (let i = 0; i < stacks; ++i) {
      for (let j = 0; j < slices; ++j) {
        const first = (i * (slices + 1)) + j;
        const second = first + slices + 1; // Vertex directly below 'first'

        // Original (problematic) order:
        // indices.push(first, second, first + 1);
        // indices.push(second, second + 1, first + 1);

        // Corrected order for CCW winding when viewed from outside
        // This forms two triangles (first, first+1, second) and (first+1, second+1, second)
        // that together form a quad from the mesh grid.
        indices.push(first, first + 1, second);
        indices.push(first + 1, second + 1, second);
      }
    }


    super(vertices, normals, uvs, indices);
  }
}
