import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { DirectionalLight } from "@engine/entities/light";
import { SceneManager } from "@engine/entities/scene-manager";
import { vec3 } from "gl-matrix";


export class LightMoveBehaviour extends EntityBehaviour {
  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  distancey = 500;
  distance = 10000;
  speed = 0.03;
  t = 0;


  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;

    this.transform.setPosition(this.distance * x, this.distancey, this.distance * z);
    this.transform.lookAt(vec3.create(), vec3.fromValues(0, 1, 0));
    const parentLight = (this.parent as DirectionalLight);
    if (parentLight.direction) {
      parentLight.direction = this.transform.back;
    }
    this.t += this.speed * ellapsed;
  }
}


SceneManager.addDependency(LightMoveBehaviour.name, LightMoveBehaviour.instanciate);
