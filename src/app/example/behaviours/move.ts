import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { SceneManager } from "@engine/entities/scene-manager";



export class MoveBehaviour extends EntityBehaviour {
  static override instanciate(): MoveBehaviour {
    return new MoveBehaviour()
  }

  distance = 10;
  speed = 0.9;
  t = 1;

  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;

    this.transform.setPosition(this.distance * x,
      0,
      this.distance * z);
    // this.parent.transform.updateModelMatrix();
    this.t += this.speed * ellapsed;
  }
}

SceneManager.addDependency(MoveBehaviour.name, MoveBehaviour.instanciate);
