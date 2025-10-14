import { EngineCache } from "../core";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { CubemapTexture } from "../textures/cubemap-texture";
import { ColorMaterial } from "./color-material";

/**
  Represents a material that uses a cube map texture for skyboxes or reflections.
 * @augments {ColorMaterial}
 */
export class CubemapMaterial extends ColorMaterial {

  protected override _className = "CubemapMaterial";
  /**
    The cube map texture.
   * @type {CubemapTexture}
   */
  public mainTex!: CubemapTexture;

  /**
    Deserializes the material's state from a JSON object.
   * Note: This implementation currently does not deserialize properties.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    if (jsonObject["mainTex"].uris) {
      const keys = jsonObject["mainTex"].uris;
      this.mainTex = EngineCache.getTextureCube({
        right: keys[0], left: keys[1],
        up: keys[2], bottom: keys[3],
        front: keys[4], back: keys[5],
      }) as CubemapTexture;
      this.mainTex.fromJson(jsonObject["mainTex"]);
    }
  }

  /**
    Serializes the material's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      mainTex: this.mainTex?.toJsonObject()
    };
  }

  /**
    Creates a new instance of CubemapMaterial.

   * @override
   * @returns {CubemapMaterial} - A new CubemapMaterial instance.
   */
  static override instanciate(): CubemapMaterial {
    return new CubemapMaterial();
  }

}
