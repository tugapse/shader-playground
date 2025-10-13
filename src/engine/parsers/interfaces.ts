import { vec4 } from "gl-matrix";

/**
 * @interface ParsedObjData
  Represents the consolidated mesh data parsed from an OBJ file,
 * ready for use in a graphics API like WebGL.
 */
export interface ParsedObjData {
  /**
    Flattened array of vertex positions (e.g., [x1, y1, z1, x2, y2, z2, ...]).
   * @type {number[]}
   */
  vertices: number[];
  /**
    Flattened array of vertex normals (e.g., [nx1, ny1, nz1, nx2, ny2, nz2, ...]).
   * @type {number[]}
   */
  normals: number[];
  /**
    Flattened array of vertex texture coordinates (e.g., [u1, v1, u2, v2, ...]).
   * @type {number[]}
   */
  uvs: number[];
  /**
    Indexed drawing buffer: A list of indices referring to the consolidated
   * vertex attributes (positions, normals, uvs). These define the triangles.
   * @type {number[]}
   */
  indices: number[];
}

/**
 * @interface ObjFace
  Represents a single face (polygon) as defined in the OBJ file,
 * storing 0-based indices to original vertex, UV, and normal lists.
 */
export interface ObjFace {
  /**
    Array of 0-based vertex position indices for this face.
   * @type {number[]}
   */
  positions: number[];
  /**
    Array of 0-based vertex texture coordinate indices for this face.
   * Can contain -1 if UVs are not provided for a vertex.
   * @type {number[]}
   */
  uvs: number[];
  /**
    Array of 0-based vertex normal indices for this face.
   * Can contain -1 if normals are not provided for a vertex.
   * @type {number[]}
   */
  normals: number[];
}

/**
 * @interface MtlMaterial
  Represents a single material definition parsed from an MTL file.
 */
export interface MtlMaterial {
  /**
    The name of the material, as defined by the `newmtl` tag.
   * @type {string}
   */
  name: string;

  /**
    Specular exponent (shininess), typically a value from 0 to 1000.
   * @type {number | undefined}
   */
  Ns?: number;
  /**
    Ambient color (rgba).
   * @type {vec4 | undefined}
   */
  Ka?: vec4;
  /**
    Diffuse color (rgba), often represents the base color.
   * @type {vec4 | undefined}
   */
  Kd?: vec4;
  /**
    Specular color (rgba).
   * @type {vec4 | undefined}
   */
  Ks?: vec4;
  /**
    Emissive color (rgba), for self-illuminated objects.
   * @type {vec4 | undefined}
   */
  Ke?: vec4;
  /**
    Optical density (index of refraction).
   * @type {number | undefined}
   */
  Ni?: number;
  /**
    Dissolve (alpha/transparency), a value from 0.0 (fully transparent) to 1.0 (fully opaque).
   * @type {number | undefined}
   */
  d?: number;
  /**
    Illumination model, specified by an integer code.
   * @type {number | undefined}
   */
  illum?: number;
  /**
    Path to the diffuse texture map file.
   * @type {string | undefined}
   */
  map_Kd?: string;
  /**
    Path to the specular texture map file.
   * @type {string | undefined}
   */
  map_Ks?: string;
  /**
    Path to the bump map or normal map file.
   * @type {string | undefined}
   */
  map_Bump?: string;
}

/**
 * @interface ParsedMtlData
  Holds a collection of materials parsed from an MTL file,
 * mapped by their material names.
 */
export interface ParsedMtlData {
  /**
    An index signature that maps a material name to its `MtlMaterial` object.
   * @type {MtlMaterial}
   */
  [materialName: string]: MtlMaterial;
}