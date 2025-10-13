import { vec2, vec3 } from "gl-matrix";
import { MeshData } from "../core/mesh";
import { ObjFace } from "./interfaces";

/**
  A class for parsing Wavefront .obj files and converting the data into a WebGL-compatible MeshData format.
 */
export class ObjParser {
  /**
    Temporary array to store raw vertex position data as it is parsed from the file.
   * @private
   * @type {number[]}
   */
  private tempVertices: number[] = [];
  /**
    Temporary array to store raw normal vector data as it is parsed from the file.
   * @private
   * @type {number[]}
   */
  private tempNormals: number[] = [];
  /**
    Temporary array to store raw texture coordinate (UV) data as it is parsed from the file.
   * @private
   * @type {number[]}
   */
  private tempUVs: number[] = [];
  /**
    Temporary array to store face data with 1-based indices, before consolidation.
   * @private
   * @type {ObjFace[]}
   */
  private tempFaces: ObjFace[] = [];

  /**
    Final processed vertex position data in a format suitable for WebGL buffers.
   * @private
   * @type {vec3[]}
   */
  private outputVertices: vec3[] = [];
  /**
    Final processed normal vector data in a format suitable for WebGL buffers.
   * @private
   * @type {vec3[]}
   */
  private outputNormals: vec3[] = [];
  /**
    Final processed texture coordinate (UV) data in a format suitable for WebGL buffers.
   * @private
   * @type {vec2[]}
   */
  private outputUVs: vec2[] = [];
  /**
    Final processed indices for drawing, which reference the consolidated vertex data.
   * @private
   * @type {number[]}
   */
  private outputIndices: number[] = [];

  /**
    Parses the content of an OBJ file string.
   * @param {string} objContent - The entire content of the OBJ file as a string.
   * @returns {MeshData} - A MeshData object containing the parsed and consolidated mesh data.
   */
  public parse(objContent: string): MeshData {
    this.resetParser();

    const lines = objContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
      const prefix = parts[0];

      switch (prefix) {
        case 'v':
          this.parseVertex(parts);
          break;
        case 'vt':
          this.parseUV(parts);
          break;
        case 'vn':
          this.parseNormal(parts);
          break;
        case 'f':
          this.parseFace(parts);
          break;
        default:
          break;
      }
    }

    this.consolidateMeshData();
    
    return new MeshData(
      this.outputVertices,
      this.outputNormals,
      this.outputUVs,
      this.outputIndices,
    );
  }

  /**
    Resets all internal temporary and output arrays to prepare for parsing a new OBJ file.
   * @private
   * @returns {void}
   */
  private resetParser(): void {
    this.tempVertices = [];
    this.tempNormals = [];
    this.tempUVs = [];
    this.tempFaces = [];
    this.outputVertices = [];
    this.outputNormals = [];
    this.outputUVs = [];
    this.outputIndices = [];
  }

  /**
    Parses a 'v' line from the OBJ file and stores the vertex position.
   * @private
   * @param {string[]} parts - The line parts, e.g., ['v', 'x', 'y', 'z'].
   * @returns {void}
   */
  private parseVertex(parts: string[]): void {
    this.tempVertices.push(
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parseFloat(parts[3])
    );
  }

  /**
    Parses a 'vt' line from the OBJ file and stores the texture coordinates.
   * @private
   * @param {string[]} parts - The line parts, e.g., ['vt', 'u', 'v'].
   * @returns {void}
   */
  private parseUV(parts: string[]): void {
    this.tempUVs.push(
      parseFloat(parts[1]),
      parseFloat(parts[2])
    );
  }

  /**
    Parses a 'vn' line from the OBJ file and stores the normal vector.
   * @private
   * @param {string[]} parts - The line parts, e.g., ['vn', 'nx', 'ny', 'nz'].
   * @returns {void}
   */
  private parseNormal(parts: string[]): void {
    this.tempNormals.push(
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parseFloat(parts[3])
    );
  }

  /**
    Parses a 'f' line from the OBJ file, handling triangulation for N-gons, and stores the face data.
   * @private
   * @param {string[]} parts - The line parts, e.g., ['f', 'v/vt/vn', ...].
   * @returns {void}
   */
  private parseFace(parts: string[]): void {
    const face: ObjFace = { positions: [], uvs: [], normals: [] };

    for (let i = 1; i < parts.length; i++) {
      const vertexDef = parts[i];
      const indices = vertexDef.split('/').map(s => parseInt(s, 10));

      face.positions.push(indices[0] - 1);

      if (indices.length > 1 && !isNaN(indices[1])) {
        face.uvs.push(indices[1] - 1);
      } else {
        face.uvs.push(-1);
      }

      if (indices.length > 2 && !isNaN(indices[2])) {
        face.normals.push(indices[2] - 1);
      } else if (indices.length === 2 && isNaN(indices[1])) {
        face.normals.push(indices[2] - 1);
      } else {
        face.normals.push(-1);
      }
    }

    if (face.positions.length >= 3) {
      for (let i = 1; i < face.positions.length - 1; i++) {
        this.tempFaces.push({
          positions: [face.positions[0], face.positions[i], face.positions[i + 1]],
          uvs: face.uvs.includes(-1) ? [-1, -1, -1] : [face.uvs[0], face.uvs[i], face.uvs[i + 1]],
          normals: face.normals.includes(-1) ? [-1, -1, -1] : [face.normals[0], face.normals[i], face.normals[i + 1]]
        });
      }
    }
  }

  /**
    Consolidates the temporary face data into a single, indexed set of buffers for rendering. This process handles duplicate vertices by creating a unique mapping for each combination of position, UV, and normal.
   * @private
   * @returns {void}
   */
  private consolidateMeshData(): void {
    const uniqueVertexMap = new Map<string, number>();
    let currentOutputIndex = 0;

    for (const face of this.tempFaces) {
      for (let i = 0; i < 3; i++) {
        const posIdx = face.positions[i];
        const uvIdx = face.uvs[i];
        const normIdx = face.normals[i];

        const key = `${posIdx}/${uvIdx}/${normIdx}`;

        if (!uniqueVertexMap.has(key)) {
          uniqueVertexMap.set(key, currentOutputIndex);

          this.outputVertices.push(vec3.fromValues(
            this.tempVertices[posIdx * 3 + 0],
            this.tempVertices[posIdx * 3 + 1],
            this.tempVertices[posIdx * 3 + 2]
          ));

          if (uvIdx !== -1) {
            this.outputUVs.push(vec2.fromValues(
              this.tempUVs[uvIdx * 2 + 0],
              this.tempUVs[uvIdx * 2 + 1]
            ));
          } else {
            this.outputUVs.push(vec2.fromValues(0.0, 0.0));
          }

          if (normIdx !== -1) {
            this.outputNormals.push(vec3.fromValues(
              this.tempNormals[normIdx * 3 + 0],
              this.tempNormals[normIdx * 3 + 1],
              this.tempNormals[normIdx * 3 + 2]
            ));
          } else {
            this.outputNormals.push(vec3.fromValues(0.0, 0.0, 0.0));
          }
          currentOutputIndex++;
        }
        this.outputIndices.push(uniqueVertexMap.get(key)!);
      }
    }
  }
}