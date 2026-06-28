import { v4 as uuidV4 } from 'uuid';
import { JsonSerializedData } from '../interfaces/json-serialized-data.interface';
/**
  An abstract base class providing a common interface for objects that can be serialized to and deserialized from a JSON object.
 */
export class JsonSerializable {
  [key: string]: any;
  public name: string = '';
  protected _className: string;
  protected _uuid: string;
  protected _serializationIgnoreKeys: string[];

  public get className(): string {
    return this._className;
  }
  public get uuid(): string {
    return this._uuid;
  }

  constructor(className: string) {
    if (!className) throw new Error('className is required');
    this._className = className;
    this.name = this.name;
    this._uuid = uuidV4();
    this._serializationIgnoreKeys = [
      '_serializationIgnoreKeys',
      'scene',
      'parent',
    ];
  }

  private loopAndSaveProperties(value: any): any {
    const type = typeof value;

    // Rule 1: Handle primitives (string, number, boolean)
    if (
      value === null ||
      type === 'string' ||
      type === 'number' ||
      type === 'boolean'
    ) {
      return value;
    }

    // Rule 2: Handle objects with a toJsonObject method (like Color, NumberRange, etc.)
    if (value && typeof value.toJsonObject === 'function') {
      return value.toJsonObject();
    }

    // Rule 3: Handle plain objects recursively
    if (
      type === 'object' &&
      !Array.isArray(value) &&
      value?.constructor === Object
    ) {
      const data: JsonSerializedData = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          data[key] = this.loopAndSaveProperties(value[key]);
        }
      }
      return data;
    }

    // Return undefined for types we can't or shouldn't serialize (like functions)
    return undefined;
  }

  protected getBaseJsonInfo(): JsonSerializedData {
    return {
      type: this.constructor.name,
      name: this.name,
      className: this.className,
      uuid: this.uuid,
    };
  }
  protected serializeAutomatically(): JsonSerializedData {
    const data: JsonSerializedData = {};

    for (const key of Object.keys(this)) {
      if (this._serializationIgnoreKeys.includes(key)) {
        continue;
      }
      const value = (this as any)[key];
      const serializedValue = this.loopAndSaveProperties(value);

      if (serializedValue !== undefined) {
        data[key] = serializedValue;
      }
    }

    // Add/overwrite base properties to ensure they are correct.
    return {
      ...data,
      type: this.constructor.name,
      name: this.name,
      className: this.className,
      uuid: this.uuid,
    };
  }

  private populateProperties(target: any, source: JsonSerializedData): void {
    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      if (!Object.prototype.hasOwnProperty.call(target, key)) continue;

      const sourceValue = source[key];
      const targetProperty = target[key];

      if (sourceValue === null || typeof sourceValue !== 'object') {
        // Primitive from JSON, just assign it.
        target[key] = sourceValue;
      } else if (
        targetProperty &&
        typeof targetProperty.fromJson === 'function'
      ) {
        // The property on our class instance knows how to deserialize itself (e.g., Color, NumberRange).
        targetProperty.fromJson(sourceValue);
      } else if (
        targetProperty &&
        typeof targetProperty === 'object' &&
        !Array.isArray(targetProperty) &&
        targetProperty.constructor === Object
      ) {
        // It's a nested plain object, recurse.
        this.populateProperties(targetProperty, sourceValue);
      } else {
        // For other cases (like arrays or complex objects without fromJson), a simple assignment might work for PODs (Plain Old Data).
        // A more robust solution might require special handling for arrays of JsonSerializable objects.
        target[key] = sourceValue;
      }
    }
  }

  protected deserializeAutomatically(jsonObject: JsonSerializedData): void {
    // The `super.fromJson` call should be made by the derived class before calling this helper.
    // Create a copy of the jsonObject to avoid modifying the original, and remove keys we don't want to auto-populate.
    const dataToPopulate = { ...jsonObject };
    const baseKeys = ['type', 'name', 'className', 'uuid'];
    for (const key of [...baseKeys, ...this._serializationIgnoreKeys]) {
      delete (dataToPopulate as any)[key];
    }

    this.populateProperties(this, dataToPopulate);
  }

  /**
    Serializes the object to a JSON-compatible data structure.
   * @returns {JsonSerializedData} - A JSON data object representing the serialized state.
   */
  public toJsonObject(): JsonSerializedData {
    return this.getBaseJsonInfo();
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
}
