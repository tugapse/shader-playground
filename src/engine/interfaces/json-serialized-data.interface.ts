/**
  An interface representing a generic JSON-serializable data structure.
 * It's a key-value pair where keys are strings and values can be any type,
 * providing a flexible contract for serialization and deserialization methods.
 */
export interface JsonSerializedData {
  [key: string]: any;
}