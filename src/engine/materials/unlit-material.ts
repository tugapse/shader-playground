import { vec2 } from "gl-matrix";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { Texture } from "../textures/texture";
import { ColorMaterial } from "./color-material";
import { EngineCache, Vector2 } from "../core";

/**
  Represents a simple, unlit material that uses a color and a main texture.
 * @augments {ColorMaterial}
 */
export class UnlitMaterial extends ColorMaterial {
  protected override _className = "UnlitMaterial";


  /**
    The UV scaling factor for the main texture.
   * @type {vec2}
   */
  public uvScale: Vector2 = new Vector2(1, 1);
  /**
    The UV offset for the main texture.
   * @type {vec2}
   */
  public uvOffset: Vector2 = new Vector2(0,0);
  /**
    The main texture object.
   * @type {Texture}
   */
  public mainTex!: Texture;

  /**
    Serializes the material's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      mainTex: this.mainTex?.toJsonObject(),
      uvScale: [...this.uvScale.vector],
      uvOffset: [...this.uvOffset.vector],
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
    if (jsonObject["mainTex"]?.url) {
      this.mainTex = EngineCache.getTexture2D(jsonObject["mainTex"].url);
      this.mainTex.fromJson(jsonObject['mainTex']);
    }
    jsonObject['uvScale'] && this.uvScale.set(...jsonObject['uvScale']);
    jsonObject['uvOffset'] && this.uvOffset.set(...jsonObject['uvOffset']);
  }

  /**
    Creates a new instance of UnlitMaterial.

   * @override
   * @returns {UnlitMaterial} - A new UnlitMaterial instance.
   */
  static override instanciate(): UnlitMaterial {
    return new UnlitMaterial();
  }

  public destroy(): void {
    if (this.mainTex) {
      this.mainTex.destroy();
    }
  }
}
