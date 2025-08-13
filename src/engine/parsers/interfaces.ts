
import { vec4 } from "gl-matrix"; // Assuming vec4 for colors

/**
 * @interface ParsedObjData
 * @description Represents the consolidated mesh data parsed from an OBJ file,
 * ready for use in a graphics API like WebGL.
 */
export interface ParsedObjData {
  /**
   * Flattened array of vertex positions (e.g., [x1, y1, z1, x2, y2, z2, ...]).
   */
  vertices: number[];
  /**
   * Flattened array of vertex normals (e.g., [nx1, ny1, nz1, nx2, ny2, nz2, ...]).
   */
  normals: number[];
  /**
   * Flattened array of vertex texture coordinates (e.g., [u1, v1, u2, v2, ...]).
   */
  uvs: number[];
  /**
   * Indexed drawing buffer: A list of indices referring to the consolidated
   * vertex attributes (positions, normals, uvs). These define the triangles.
   */
  indices: number[];
  // You could extend this to include:
  // materials: { [name: string]: any }; // Parsed material data from .mtl files
  // objects: { name: string, material?: string, startIndex: number, count: number }[]; // For multiple objects/groups
}

/**
 * @interface ObjFace
 * @description Represents a single face (polygon) as defined in the OBJ file,
 * storing 0-based indices to original vertex, UV, and normal lists.
 */
export interface ObjFace {
  /**
   * Array of 0-based vertex position indices for this face.
   */
  positions: number[];
  /**
   * Array of 0-based vertex texture coordinate indices for this face.
   * Can contain -1 if UVs are not provided for a vertex.
   */
  uvs: number[];
  /**
   * Array of 0-based vertex normal indices for this face.
   * Can contain -1 if normals are not provided for a vertex.
   */
  normals: number[];
}


/**
 * @interface MtlMaterial
 * @description Represents a single material definition parsed from an MTL file.
 */
export interface MtlMaterial {
  name: string;

  // Common properties
  Ns?: number; // Specular exponent (shininess)
  Ka?: vec4;   // Ambient color (rgba, a is usually 1.0)
  Kd?: vec4;   // Diffuse color (rgba, a is usually 1.0) - Often maps to base color
  Ks?: vec4;   // Specular color (rgba, a is usually 1.0)
  Ke?: vec4;   // Emissive color (rgba, a is usually 1.0)
  Ni?: number; // Optical density (index of refraction)
  d?: number;  // Dissolve (alpha/transparency), 0.0 to 1.0
  illum?: number; // Illumination model (integer)

  // Texture maps (paths to image files) - not in your example, but common
  map_Kd?: string; // Diffuse texture map
  map_Ks?: string; // Specular texture map
  map_Bump?: string; // Bump map
  // ... many other map types exist (map_Ka, map_d, etc.)
}

/**
 * @interface ParsedMtlData
 * @description Holds a collection of materials parsed from an MTL file,
 * mapped by their material names.
 */
export interface ParsedMtlData {
  [materialName: string]: MtlMaterial;
}
