// src/primitives/CubePrimitive.ts

import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";
import { CubePrimitive } from "./cube-primitive";

export class SkyboxPrimitive extends CubePrimitive {
  constructor(size: number = 2.0) {
    super(size);
  }
}
