import { EntityBehaviour } from "../behaviours/entity-behaviour";
import { Transform } from "../core/transform";
import { Scene } from "./scene";



export class GlEntity {

  public scene!:Scene;
  public behaviours: EntityBehaviour[] = []
  public active: boolean = true;
  public tag: string = "Entity";

  constructor(public name: String, public transform: Transform=new Transform()) { }

  public initialize() {
    for (const behaviour of this.behaviours) {
      behaviour.initialize();
    }
  }

  public update(ellapsed: number): void {
    if (!this.active) return;

    for (const behaviour of this.behaviours) {
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
}
