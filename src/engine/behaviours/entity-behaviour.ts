import { Transform } from "../core/transform";
import { GlEntity } from "../entities/entity";
import { JsonSerializable } from "../core/json-serializable";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { v4 as uuidv4 } from 'uuid';
import { RenderLayer } from "../enums";

/**
 * Represents the base class for all components that define the behavior of an entity.
 * This class provides the foundational structure for creating custom scripts that can be attached to entities in the scene.
 * It includes lifecycle methods such as `initialize`, `update`, and `destroy`, as well as serialization functions.
 * @augments {JsonSerializable}
 */
export class EntityBehaviour extends JsonSerializable {

  /**
   * A static factory method to create an instance of the behaviour.
   * This method is intended to be overridden by subclasses to provide a way to create instances of the specific behaviour type.
   * @param {any} [args] - Optional arguments for instantiation.
   * @returns {EntityBehaviour}
   */
  static instanciate(args?: any): EntityBehaviour { return new EntityBehaviour(); }


  [key: string]: any;
  /**
   * Indicates whether the behaviour is currently active.
   * An inactive behaviour will not have its `update` method called.
   * @type {boolean}
   */
  public active: boolean = true;

  /**
   * The render layer this behaviour belongs to.
   * This is used to determine the rendering order of the entity.
   * @type {RenderLayer}
   */
  public renderLayer : RenderLayer = RenderLayer.OPAQUE;
  /**
   * The parent entity to which this behaviour is attached.
   * @type {GlEntity}
   */
  public parent!: GlEntity;
  /**
   * A flag indicating if the behaviour has been initialized.
   * @protected
   * @type {boolean}
   */
  protected _initialized = false;

  /**
   * Gets the transform component of the parent entity.
   * This provides easy access to the position, rotation, and scale of the entity.
   * @type {Transform}
   */
  public get transform(): Transform {
    return this.parent?.transform;
  }

  /**
   * Creates an instance of EntityBehaviour.
   */
  constructor() {
    super("EntityBehaviour");
    this._uuid = uuidv4();
    this._serializationIgnoreKeys.push('parent', '_initialized',"_serializationIgnoreKeys");
  }

  /**
   * Initializes the behaviour.
   * This method is called once when the behaviour is first added to an entity.
   * @returns {boolean} - True if initialization is successful.
   */
  public initialize(): boolean {
    return (this._initialized = true);
  }

  /**
   * Updates the behaviour every frame.
   * This method is called on every frame for active behaviours.
   * @param {number} elapsed - The time elapsed since the last frame in seconds.
   */
  public update(elapsed: number): void { }

  /**
   * Updates the behaviour specifically for editor mode.
   * This method is called on every frame when the engine is in editor mode.
   * @param {number} elapsed - The time elapsed since the last frame in seconds.
   */
  public updateEditor(elapsed: number): void { }

  /**
   * Draws any visual representation of the behaviour.
   * This is often used for debugging purposes, such as drawing bounding boxes or other gizmos.
   */
  public draw(): void { }

  /**
   * Cleans up resources used by the behaviour.
   * This method is called when the behaviour is about to be destroyed.
   */
  public destroy(): void { }

  /**
   * Serializes the behaviour's state to a JSON object.
   * This is used for saving the scene or entity state.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      active: this.active,
      uuid: this.uuid
    };
  }

  /**
   * Deserializes the behaviour's state from a JSON object.
   * This is used for loading a scene or entity state.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.active = jsonObject["active"];
    this._uuid = jsonObject['uuid'];
  }

  /**
   * Creates a clone of the behaviour.
   * This method should be overridden by subclasses to implement deep cloning of the behaviour.
   * @returns {EntityBehaviour | null} - A new instance of the behaviour or null if not implemented.
   */
  public clone(): EntityBehaviour | null {
    return null;
  }
}
