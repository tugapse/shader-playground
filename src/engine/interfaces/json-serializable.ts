export interface JsonSerializable {
  toJsonObject(): { [key: string]: any };
  fromJson(jsonObject: { [key: string]: any }): void;
}
