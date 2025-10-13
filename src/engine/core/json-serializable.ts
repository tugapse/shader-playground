import { v4 as uuidV4 } from 'uuid';
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
/**
  An abstract base class providing a common interface for objects that can be serialized to and deserialized from a JSON object.
 */
export class JsonSerializable {

  public get className(): string { return this._className }
  public name: string = "";
  protected _uuid: string;

  public get uuid(): string { return this._uuid }

  constructor(protected _className: string) {
    this._uuid = uuidV4();
  }
  /**
    Serializes the object to a JSON-compatible data structure.
   * @returns {JsonSerializedData} - A JSON data object representing the serialized state.
   */
  public toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name,
      name: this.name,
      className: this.className,
      uuid: this.uuid
    };
  }

  /**
    Deserializes the object from a JSON-compatible data structure.
   * This method is intended to be overridden by subclasses to handle their specific properties.
   * @param {JsonSerializedData} jsonObject - The JSON data object to deserialize from.
   * @returns {void}
   */
  public fromJson(jsonObject: JsonSerializedData): void {
    this.name = jsonObject['name'];
    if (jsonObject['uuid']) this._uuid = jsonObject['uuid'];
  }

  public toJSON(){
    return this.toJsonObject();
  }

}
