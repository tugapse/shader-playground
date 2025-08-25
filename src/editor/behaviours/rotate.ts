import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { SceneManager } from "@engine/entities/scene-manager";



export class RotateBehaviour extends EntityBehaviour {

  static override instanciate(): RotateBehaviour {
    return new RotateBehaviour();
  }

  speed = 0.005;
  public override update(ellapsed: number): void {
    this.transform.rotate(
      0 * this.speed, // 1 * this.speed,
      0, //1 * this.speed,
      1 * this.speed
    );
  }
}
SceneManager.addDependency(RotateBehaviour.name, RotateBehaviour.instanciate);
