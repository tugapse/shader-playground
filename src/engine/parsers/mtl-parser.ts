// MtlParser.ts

import { vec4 } from "gl-matrix"; // For parsing color values
import { MtlMaterial, ParsedMtlData } from "./interfaces";

export class MtlParser {
  private parsedMaterials: ParsedMtlData = {};
  private currentMaterial: MtlMaterial | null = null;

  /**
   * Parses the content of an MTL (Material Template Library) file string.
   * @param mtlContent The entire content of the MTL file as a string.
   * @returns A ParsedMtlData object containing all defined materials.
   */
  public parse(mtlContent: string): ParsedMtlData {
    this.resetParser(); // Clear any previous state

    const lines = mtlContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue; // Skip empty lines and comments
      }

      const parts = trimmedLine.split(/\s+/); // Split by one or more spaces
      const prefix = parts[0];

      switch (prefix) {
        case 'newmtl':
          this.handleNewMaterial(parts[1]);
          break;
        case 'Ns':
          this.setNumericProperty('Ns', parts);
          break;
        case 'Ka':
          this.setColorProperty('Ka', parts);
          break;
        case 'Kd':
          this.setColorProperty('Kd', parts);
          break;
        case 'Ks':
          this.setColorProperty('Ks', parts);
          break;
        case 'Ke':
          this.setColorProperty('Ke', parts);
          break;
        case 'Ni':
          this.setNumericProperty('Ni', parts);
          break;
        case 'd': // Dissolve (transparency)
          this.setNumericProperty('d', parts);
          break;
        case 'Tr': // Transparency (alternative to 'd')
          // 'Tr' is often 1.0 - d, so 1 - (parseFloat(parts[1]))
          this.setNumericProperty('d', parts, true); // Set 'd' property
          break;
        case 'illum':
          this.setNumericProperty('illum', parts);
          break;
        case 'map_Kd': // Diffuse texture map
          this.setTextureMapProperty('map_Kd', parts);
          break;
        // Add more cases for other MTL properties like map_Ks, map_Bump, etc.
        default:
          // console.warn(`[MTL Parser] Unknown or unsupported line prefix: ${prefix}`);
          break;
      }
    }

    return this.parsedMaterials;
  }

  private resetParser(): void {
    this.parsedMaterials = {};
    this.currentMaterial = null;
  }

  private handleNewMaterial(name: string): void {
    if (this.currentMaterial) {
      // Store the previous material before starting a new one
      this.parsedMaterials[this.currentMaterial.name] = this.currentMaterial;
    }
    this.currentMaterial = { name: name }; // Create a new material object
  }

  private setNumericProperty(propertyName: keyof MtlMaterial, parts: string[], invert: boolean = false): void {
    if (!this.currentMaterial) return;
    const value = parseFloat(parts[1]);
    if (!isNaN(value)) {
      (this.currentMaterial as any)[propertyName] = invert ? (1.0 - value) : value;
    }
  }

  private setColorProperty(propertyName: keyof MtlMaterial, parts: string[]): void {
    if (!this.currentMaterial) return;
    // Colors are R G B, need to convert to vec4 (with alpha 1.0)
    const r = parseFloat(parts[1]);
    const g = parseFloat(parts[2]);
    const b = parseFloat(parts[3]);

    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      (this.currentMaterial as any)[propertyName] = vec4.fromValues(r, g, b, 1.0);
    }
  }

  private setTextureMapProperty(propertyName: keyof MtlMaterial, parts: string[]): void {
    if (!this.currentMaterial) return;
    // Texture map path is the rest of the line, after the prefix
    const path = parts.slice(1).join(' '); // Re-join if path has spaces
    if (path) {
      (this.currentMaterial as any)[propertyName] = path;
    }
  }
}
