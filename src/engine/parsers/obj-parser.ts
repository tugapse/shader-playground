// ObjParser.ts

import { MeshData } from "@engine/core/mesh";
import { ObjFace, ParsedObjData } from "./interfaces";
import { vec2, vec3 } from "gl-matrix";

export class ObjParser {
  // Temporary arrays to store data as we parse
  private tempVertices: number[] = [];
  private tempNormals: number[] = [];
  private tempUVs: number[] = [];
  private tempFaces: ObjFace[] = [];

  // Final processed data that will be returned
  private outputVertices: vec3[] = [];
  private outputNormals: vec3[] = [];
  private outputUVs: vec2[] = [];
  private outputIndices: number[] = []; // Indices for drawing (e.g., in WebGL)

  /**
   * Parses the content of an OBJ file string.
   * @param objContent The entire content of the OBJ file as a string.
   * @returns A ParsedObjData object containing the mesh data.
   */
  public parse(objContent: string): MeshData {
    this.resetParser(); // Clear previous data

    const lines = objContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue; // Skip empty lines and comments
      }

      const parts = trimmedLine.split(/\s+/); // Split by one or more spaces
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
        // You can add more cases for 'o', 'mtllib', 'usemtl', 's', etc.
        // case 'o':
        //   console.log('Object Name:', parts[1]);
        //   break;
        // case 'mtllib':
        //   console.log('Material Library:', parts[1]);
        //   break;
        // case 'usemtl':
        //   console.log('Using Material:', parts[1]);
        //   break;
        default:
          // console.warn(`Unknown OBJ line prefix: ${prefix}`);
          break;
      }
    }

    // After parsing all lines, consolidate data for drawing
    this.consolidateMeshData();

    return {
      vertices: this.outputVertices,
      normals: this.outputNormals,
      uvs: this.outputUVs,
      indices: this.outputIndices,
    };
  }

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

  private parseVertex(parts: string[]): void {
    // 'v x y z'
    this.tempVertices.push(
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parseFloat(parts[3])
    );
  }

  private parseUV(parts: string[]): void {
    // 'vt u v' (or 'vt u v w', w is often 0 or 1, we usually only care about u,v)
    this.tempUVs.push(
      parseFloat(parts[1]),
      parseFloat(parts[2])
    );
  }

  private parseNormal(parts: string[]): void {
    // 'vn nx ny nz'
    this.tempNormals.push(
      parseFloat(parts[1]),
      parseFloat(parts[2]),
      parseFloat(parts[3])
    );
  }

  private parseFace(parts: string[]): void {
    // 'f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 ...'
    // Can also be 'f v1 v2 v3' or 'f v1/vt1 v2/vt2' or 'f v1//vn1 v2//vn2'
    const face: ObjFace = { positions: [], uvs: [], normals: [] };

    // Start from index 1 because parts[0] is 'f'
    for (let i = 1; i < parts.length; i++) {
      const vertexDef = parts[i]; // e.g., "1/1/1", "5/2/1", "3", "4//2"

      const indices = vertexDef.split('/').map(s => parseInt(s, 10));

      // OBJ indices are 1-based, so subtract 1 for 0-based arrays
      // Handle missing indices (e.g., 'v' only, 'v/vt', 'v//vn')
      face.positions.push(indices[0] - 1); // Vertex index is always present

      if (indices.length > 1 && !isNaN(indices[1])) {
        face.uvs.push(indices[1] - 1); // Texture coord index
      } else {
        face.uvs.push(-1); // Mark as not present
      }

      if (indices.length > 2 && !isNaN(indices[2])) {
        face.normals.push(indices[2] - 1); // Normal index
      } else if (indices.length === 2 && isNaN(indices[1])) {
        // This case handles 'v//vn' where indices[1] would be NaN
        face.normals.push(indices[2] - 1);
      } else {
        face.normals.push(-1); // Mark as not present
      }
    }

    // OBJ faces can be N-gons. For WebGL (which uses triangles),
    // we need to triangulate them. A common method is fan triangulation.
    if (face.positions.length >= 3) {
      for (let i = 1; i < face.positions.length - 1; i++) {
        // Triangle 1: (0, 1, 2)
        // Triangle 2: (0, 2, 3)
        // ...
        this.tempFaces.push({
          positions: [face.positions[0], face.positions[i], face.positions[i + 1]],
          uvs: face.uvs.includes(-1) ? [-1, -1, -1] : [face.uvs[0], face.uvs[i], face.uvs[i + 1]],
          normals: face.normals.includes(-1) ? [-1, -1, -1] : [face.normals[0], face.normals[i], face.normals[i + 1]]
        });
      }
    }
  }

  // Maps OBJ indices to continuous WebGL-compatible buffers
  private consolidateMeshData(): void {
    const uniqueVertexMap = new Map<string, number>(); // Maps "v_idx/vt_idx/vn_idx" to new flat index
    let currentOutputIndex = 0;

    for (const face of this.tempFaces) {
      for (let i = 0; i < 3; i++) { // Each triangulated face has 3 vertices
        const posIdx = face.positions[i];
        const uvIdx = face.uvs[i];
        const normIdx = face.normals[i];

        // Create a unique key for each combination of (position, uv, normal)
        const key = `${posIdx}/${uvIdx}/${normIdx}`;

        if (!uniqueVertexMap.has(key)) {
          // If this combination is new, add its data to the output arrays
          uniqueVertexMap.set(key, currentOutputIndex);

          // Add position data
          this.outputVertices.push(vec3.fromValues(
            this.tempVertices[posIdx * 3 + 0],
            this.tempVertices[posIdx * 3 + 1],
            this.tempVertices[posIdx * 3 + 2])
          );

          // Add UV data (handle if not present in OBJ)
          if (uvIdx !== -1) {
            this.outputUVs.push(vec2.fromValues(
              this.tempUVs[uvIdx * 2 + 0],
              this.tempUVs[uvIdx * 2 + 1])
            );
          } else {
            this.outputUVs.push(vec2.fromValues(0.0, 0.0)); // Default UV if not provided
          }

          // Add Normal data (handle if not present in OBJ)
          if (normIdx !== -1) {
            this.outputNormals.push(vec3.fromValues(
              this.tempNormals[normIdx * 3 + 0],
              this.tempNormals[normIdx * 3 + 1],
              this.tempNormals[normIdx * 3 + 2])
            );
          } else {
            // If no normal provided, add a default (e.g., [0,0,0] or calculate later)
            this.outputNormals.push(vec3.fromValues(0.0, 0.0, 0.0));
          }
          currentOutputIndex++;
        }
        // Add the new flat index to the output indices list
        this.outputIndices.push(uniqueVertexMap.get(key)!);
      }
    }
  }
}
