import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { v4 as uuidv4 } from 'uuid';
import { EntityBehaviour } from "../behaviours/entity-behaviour";
import { Transform } from "../core/transform";
import { Scene } from "./scene";
import { EntityType } from "@engine/enums/entity-type";



export class GlEntity implements JsonSerializable {

  public static instanciate(name = "Entity", transform?: Transform) {
    return new GlEntity(name, transform);
  }

  public scene!: Scene;
  public active: boolean = true;
  public show: boolean = true;

  public tag: string = "Entity";
  public updateInEditor = false;
  protected behaviours: EntityBehaviour[] = []
  protected _uuid!: string;
  public get uuid(): string {
    return this._uuid;
  };

  public entityType:EntityType|number = EntityType.STATIC;


  constructor(public name: String, public transform: Transform = new Transform()) {
    this._uuid = uuidv4();
  }



  public initialize() {
    for (const behaviour of this.behaviours) {
      behaviour.initialize();
    }
  }

  public update(ellapsed: number): void {
    if (!this.active || !this.scene) return;

    for (const behaviour of this.behaviours) {
      if (this.scene.isEditorMode && !this.updateInEditor)
        behaviour.updateEditor(ellapsed);
      else
        behaviour.update(ellapsed);
    }
  }


  public draw(): void {
    if (!this.active) return;

    for (const behaviour of this.behaviours) {
      behaviour.draw();
    }
  }

  public destroy() {
    for (const behaviour of this.behaviours) {
      behaviour.destroy();
    }
  }

  public addBehaviour(behaviour: EntityBehaviour) {
    behaviour.parent = this;
    behaviour.initialize();
    this.behaviours.push(behaviour);
  }

  public removeBehaviour(behaviour: EntityBehaviour) {
    const index = this.behaviours.indexOf(behaviour);
    if (index >= 0) {
      const beToremove = this.behaviours.splice(index, 1);
      beToremove[0]?.destroy();
    }
  }

  /**
  * Retrieves behaviours of a specific type from the collection.
  * T must be a type that extends EntityBehaviour.
  * @param constructor The constructor function of the type to filter by.
  * @returns An array of behaviours of the specified type.
  */
  public getBehaviours<T extends EntityBehaviour>(constructor: new (...args: any[]) => T): T[] {
    return this.behaviours.filter((o): o is T => o instanceof constructor);
  }

  /**
* Retrieves behaviours of a specific type from the collection.
* T must be a type that extends EntityBehaviour.
* @param constructor The constructor function of the type to filter by.
* @returns An array of behaviours of the specified type.
*/
  public getBehaviour<T extends EntityBehaviour>(constructor: new (...args: any[]) => T): T | undefined {
    return this.behaviours.find((o): o is T => o instanceof constructor);
  }

  public fromJson(jsonObject: JsonSerializedData): void {
    if (jsonObject['type'] != this.constructor.name) return;
    this.name = jsonObject['name'];
    this.entityType = jsonObject['entityType'] as EntityType;
    this._uuid = jsonObject['uuid'] || uuidv4();
    this.active = jsonObject['active'];
    this.show = jsonObject['show'];
    this.tag = jsonObject['tag'];
    this.updateInEditor = jsonObject['updateInEditor'];
    this.transform.fromJson(jsonObject['transform']);
  }


  public toJsonObject(): JsonSerializedData {
    const result = {
      uuid: this.uuid,
      entityType: this.entityType,
      type: this.constructor.name,
      active: this.active,
      show: this.show,
      name: this.name,
      tag: this.tag,
      transform: this.transform.toJsonObject(),
      updateInEditor: this.updateInEditor,
      behaviours: this.behaviours.map(e => e.toJsonObject())
    };
    return result;
  }
}
