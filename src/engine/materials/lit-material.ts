import { EngineCache } from "../core";
import { Engine } from "../engine";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { Texture } from "../textures/texture";
import { UnlitMaterial } from "./unlit-material";

/**
  Represents a material that responds to lighting, including properties for specular highlights and normal mapping.
 * @augments {UnlitMaterial}
 */
export class LitMaterial extends UnlitMaterial {
  protected override _className = "LitMaterial";

  /**
    The strength of specular highlights.
   * @type {number}
   */
  public specularStrength: number = 1.0;
  /**
    The roughness of the material's surface, affecting the size of specular highlights.
   * @type {number}
   */
  public roughness: number = 0.2;
  /**
    The intensity of the normal map effect.
   * @type {number}
   */
  public normalMapStrength: number = 0.2;
  /**
    The normal map texture object.
   * @type {Texture}
   */
  public normalTex!: Texture;

  /**
    Serializes the material's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      normalTex: this.normalTex?.toJsonObject(),
      specularStrength: this.specularStrength,
      roughness: this.roughness,
      normalMapStrength: this.normalMapStrength,
    };
  }

  /**
    Deserializes the material's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    if(jsonObject["normalTex"]?.url){
      this.normalTex = EngineCache.getTexture2D(jsonObject["normalTex"].url);
      this.normalTex.fromJson(jsonObject['normalTex']);
    }
    this.roughness = jsonObject['roughness'];
    this.normalMapStrength = jsonObject['normalMapStrength'];
  }

  /**
    Creates a new instance of LitMaterial.

   * @override
   * @returns {LitMaterial} - A new LitMaterial instance.
   */
  static override instanciate(): LitMaterial {
    return new LitMaterial();
  }
}
