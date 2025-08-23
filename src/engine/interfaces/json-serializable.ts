import { JsonSerializedData } from "./json-serialized-data";

export class JsonSerializable {
  toJsonObject(): JsonSerializedData {
    return {
      type: this.constructor.name
    }
  }

  fromJson(jsonObject: JsonSerializedData): void { }
}
