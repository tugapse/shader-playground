import { Color } from "../core/color";
import { JsonSerializable } from "../core/json-serializable";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";

/**
  Represents a simple material with a single color property.
 * @augments {JsonSerializable}
 */
export class ColorMaterial extends JsonSerializable {

  constructor(){
    super("ColorMaterial");
  }

  public get type(): string { return this.constructor.name; }

  /**
    Creates a new instance of ColorMaterial.

   * @returns {ColorMaterial} - A new ColorMaterial instance.
   */
  public static instanciate(): ColorMaterial {
    return new ColorMaterial();
  }


  /**
    The color of the material.
   * @type {Color}
   */
  public color: Color = new Color();

  /**
    Serializes the material's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      name:this.name,
      color: this.color.toJsonObject(),
    };
  }

  /**
    Deserializes the material's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    this.name = jsonObject['name'];
    this.color = Color.createFromJsonData(jsonObject['color']);
  }
}
