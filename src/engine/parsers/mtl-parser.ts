import { vec4 } from "gl-matrix";
import { MtlMaterial, ParsedMtlData } from "./interfaces";

/**
  A class for parsing the contents of a Wavefront .mtl (Material Template Library) file.
 * It converts the material definitions into a structured object format.
 */
export class MtlParser {
  /**
    An object to store all the parsed materials, keyed by their `newmtl` name.
   * @private
   * @type {ParsedMtlData}
   */
  private parsedMaterials: ParsedMtlData = {};
  /**
    A reference to the material currently being parsed.
   * @private
   * @type {MtlMaterial | null}
   */
  private currentMaterial: MtlMaterial | null = null;

  /**
    Parses the content of an MTL (Material Template Library) file string.
   * @param {string} mtlContent - The entire content of the MTL file as a string.
   * @returns {ParsedMtlData} - An object containing all defined materials, keyed by name.
   */
  public parse(mtlContent: string): ParsedMtlData {
    this.resetParser();

    const lines = mtlContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
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
        case 'd':
          this.setNumericProperty('d', parts);
          break;
        case 'Tr':
          this.setNumericProperty('d', parts, true);
          break;
        case 'illum':
          this.setNumericProperty('illum', parts);
          break;
        case 'map_Kd':
          this.setTextureMapProperty('map_Kd', parts);
          break;
        default:
          break;
      }
    }

    // Store the last material if it exists
    if (this.currentMaterial) {
      this.parsedMaterials[this.currentMaterial.name] = this.currentMaterial;
    }

    return this.parsedMaterials;
  }

  /**
    Resets the parser state by clearing all stored material data.
   * @private
   * @returns {void}
   */
  private resetParser(): void {
    this.parsedMaterials = {};
    this.currentMaterial = null;
  }

  /**
    Handles the `newmtl` line, creating a new material object and storing the previous one if it exists.
   * @private
   * @param {string} name - The name of the new material.
   * @returns {void}
   */
  private handleNewMaterial(name: string): void {
    if (this.currentMaterial) {
      this.parsedMaterials[this.currentMaterial.name] = this.currentMaterial;
    }
    this.currentMaterial = { name: name };
  }

  /**
    Sets a numeric property on the current material.
   * @private
   * @param {keyof MtlMaterial} propertyName - The name of the property to set.
   * @param {string[]} parts - The line parts containing the numeric value.
   * @param {boolean} [invert=false] - If true, the value will be inverted (1.0 - value). Useful for `Tr`.
   * @returns {void}
   */
  private setNumericProperty(propertyName: keyof MtlMaterial, parts: string[], invert: boolean = false): void {
    if (!this.currentMaterial) return;
    const value = parseFloat(parts[1]);
    if (!isNaN(value)) {
      (this.currentMaterial as any)[propertyName] = invert ? (1.0 - value) : value;
    }
  }

  /**
    Sets a color property (`Ka`, `Kd`, `Ks`, `Ke`) on the current material, converting it to a `vec4`.
   * @private
   * @param {keyof MtlMaterial} propertyName - The name of the color property.
   * @param {string[]} parts - The line parts containing the R, G, and B color values.
   * @returns {void}
   */
  private setColorProperty(propertyName: keyof MtlMaterial, parts: string[]): void {
    if (!this.currentMaterial) return;
    const r = parseFloat(parts[1]);
    const g = parseFloat(parts[2]);
    const b = parseFloat(parts[3]);

    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      (this.currentMaterial as any)[propertyName] = vec4.fromValues(r, g, b, 1.0);
    }
  }

  /**
    Sets a texture map path property on the current material.
   * @private
   * @param {keyof MtlMaterial} propertyName - The name of the texture map property.
   * @param {string[]} parts - The line parts containing the texture file path.
   * @returns {void}
   */
  private setTextureMapProperty(propertyName: keyof MtlMaterial, parts: string[]): void {
    if (!this.currentMaterial) return;
    const path = parts.slice(1).join(' ');
    if (path) {
      (this.currentMaterial as any)[propertyName] = path;
    }
  }
}