import { JsonSerializable } from "@engine/interfaces/json-serializable";
import { EntityBehaviour } from "../behaviours/entity-behaviour";
import { Transform } from "../core/transform";
import { Scene } from "./scene";
import { v4 as uuidv4 } from 'uuid';
import { SceneManager } from "./scene-manager";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";



export class GlEntity implements JsonSerializable {

  public static instanciate(name = "Entity", transform?: Transform) {
    return new GlEntity(name, transform);
  }

  public scene!: Scene;
  public active: boolean = true;
  public tag: string = "Entity";
  public updateInEditor = false;
  protected _initialized = false;
  protected behaviours: EntityBehaviour[] = []
  protected _uuid!: string;
  public get uuid(): string {
    return this._uuid;
  };


  constructor(public name: String, public transform: Transform = new Transform()) {
    this._uuid = uuidv4();
  }



  public initialize() {
    if (this._initialized) return;
    for (const behaviour of this.behaviours) {
      behaviour.initialize();
    }
    this._initialized = true;
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
    if (this._initialized)
      behaviour.initialize();
    behaviour.parent = this;
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
    this._uuid = jsonObject['uuid'] || uuidv4();
    this.active = jsonObject['active'];
    this.name = jsonObject['name'];
    this.tag = jsonObject['tag'];
    this.updateInEditor = jsonObject['updateInEditor'];
    this.transform.fromJson(jsonObject['transform']);
  }


  public toJsonObject(): JsonSerializedData {
    const result = {
      uuid: this.uuid,
      type: this.constructor.name,
      active: this.active,
      name: this.name,
      tag: this.tag,
      transform: this.transform.toJsonObject(),
      updateInEditor: this.updateInEditor,
      behaviours: this.behaviours.map(e => e.toJsonObject())
    };
    return result;
  }
}
