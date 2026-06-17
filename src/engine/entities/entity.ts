import { v4 as uuidv4 } from 'uuid';
import { EntityBehaviour } from "../behaviours/entity-behaviour";
import { Transform } from "../core/transform";
import { EntityType } from '../enums/entity-type.enum';
import { JsonSerializable } from '../core/json-serializable';
import { JsonSerializedData } from '../interfaces/json-serialized-data.interface';
import { ObjectInstanciator } from '../core/object-instanciator';

/**
  The base class for all entities within the engine. It manages a transform, a collection of behaviours, and the entity's state within a scene.
 * @augments {JsonSerializable}
 */
export class GlEntity extends JsonSerializable {

  public get type(): string { return this.constructor.name; }
  public static get className() { return "GLEntity"; };

  /**
    Creates a new GlEntity instance with a given name and an optional transform.

   * @param {string} [name="Entity"] - The name of the new entity.
   * @param {Transform} [transform] - The transform for the entity. A new one is created if none is provided.
   * @returns {GlEntity} - The newly created GlEntity instance.
   */
  public static instanciate(name: string = "Entity", transform?: Transform): GlEntity {
    if (!transform || transform instanceof Transform == false) {
      transform = new Transform();
    }
    return new GlEntity(name, transform);
  }

  [key: string]: any;


  /**
    A flag indicating if the entity has been destroyed.
   * @protected
   * @type {boolean}
   */
  protected destroyed: boolean = false;
  /**
    The scene to which this entity belongs.
   * @type {import("./scene").Scene}
   */
  public scene!: import("./scene").Scene;
  /**
    A flag indicating if the entity is active and should be updated.
   * @type {boolean}
   */
  public active: boolean = true;
  /**
    A flag indicating if the entity should be rendered.
   * @type {boolean}
   */
  public show: boolean = true;
  /**
    A tag used for identifying or grouping entities.
   * @type {string}
   */
  public tag: string = "Entity";
  /**
    A flag to determine if the entity should update in the editor.
   * @type {boolean}
   */
  public updateInEditor: boolean = false;
  /**
    A collection of behaviours attached to the entity.
   * @protected
   * @type {EntityBehaviour[]}
   */
  public behaviours: EntityBehaviour[] = [];
  /**
    The unique identifier for the entity.
   * @protected
   * @type {string}
   */

  /**
    The type of the entity (e.g., STATIC, DYNAMIC).
   * @type {EntityType | number}
   */
  public entityType: EntityType | number = EntityType.STATIC;

  /**
    The transform component of the entity.
   * @type {Transform}
   */
  public transform: Transform;

  /**
    Creates an instance of GlEntity.
   * @param {string} name - The name of the entity.
   * @param {Transform} [transform=new Transform()] - The transform component.
   */
  constructor(name: string, transform: Transform = new Transform()) {
    super("GlEntity");
    this.name = name;
    this.transform = transform;
    this.transform.parentEntity = this;
  }

  /**
    Initializes the entity and all of its behaviours.
   * @returns {void}
   */
  public initialize(): void {
    for (const behaviour of this.behaviours) {
      behaviour.initialize();
    }
    this.destroyed = false;
  }

  /**
    Updates the entity and its behaviours.
   * @param {number} ellapsed - The elapsed time in seconds since the last update.
   * @returns {void}
   */
  public update(ellapsed: number): void {
    if (!this.active) return;
    this.transform.updateMatrices();
    for (const behaviour of this.behaviours.filter(b => b.active)) {
      behaviour.update(ellapsed);
    }
  }

  /**
    Draws the entity.
   * @returns {void}
   */
  public draw(): void {
    if (!this.active) return;
    for (const behaviour of this.behaviours.filter(b => b.active)) {
      behaviour.draw();
    }
  }

  /**
    Destroys the entity, cleaning up all attached behaviours.
   * @returns {void}
   */
  public destroy(): void {
    for (const behaviour of this.behaviours) {
      behaviour.destroy();
    }
    this.destroyed = true;
  }

  /**
    Adds a new behaviour to the entity.
   * @param {EntityBehaviour} behaviour - The behaviour to add.
   * @returns {void}
   */
  public addBehaviour(behaviour: EntityBehaviour): void {
    behaviour.parent = this;
    behaviour.initialize();
    this.behaviours.push(behaviour);
  }

  /**
    Removes a behaviour from the entity.
   * @param {EntityBehaviour} behaviour - The behaviour to remove.
   * @returns {void}
   */
  public removeBehaviour(behaviour: EntityBehaviour): void {
    const index = this.behaviours.indexOf(behaviour);
    if (index >= 0) {
      const beToremove = this.behaviours.splice(index, 1);
      beToremove[0]?.destroy();
    }
  }

  /**
    Retrieves all behaviours of a specific type from the collection.
   * @template T
   * @param {new (...args: any[]) => T} constructor - The constructor function of the type to filter by.
   * @returns {T[]} - An array of behaviours of the specified type.
   */
  public getBehaviours<T extends EntityBehaviour>(constructor: new (...args: any[]) => T): T[] {
    return this.behaviours.filter((o): o is T => o instanceof constructor);
  }

  /**
    Retrieves the first behaviour of a specific type from the collection.
   * @template T
   * @param {new (...args: any[]) => T} constructor - The constructor function of the type to filter by.
   * @returns {T | undefined} - The first behaviour found of the specified type, or undefined if none is found.
   */
  public getBehaviour<T extends EntityBehaviour>(constructor: new (...args: any[]) => T): T | undefined {
    return this.behaviours.find((o): o is T => o instanceof constructor);
  }
   
  /**
    Deserializes the entity's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }

  /**
    Serializes the entity's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {    
    const result = this.serializeAutomatically();
    result['behaviours'] = this.behaviours.map(b => b.toJsonObject());
    console.debug("Serialized behaviour", result)
    return result;  
 }

  /**
    Creates a deep copy of the current GlEntity instance.
   * @returns {GlEntity} - A new GlEntity instance that is a clone of the original.
   */
  public clone(): GlEntity {
    const newEntity = GlEntity.instanciate(this.name, this.transform);
    newEntity.fromJson(this.toJsonObject());
    return newEntity;
  }
}
