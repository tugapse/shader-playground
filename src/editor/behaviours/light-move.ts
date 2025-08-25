import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { DirectionalLight } from "@engine/entities/light";
import { SceneManager } from "@engine/entities/scene-manager";
import { mat4, vec3 } from "gl-matrix";


export class LightMoveBehaviour extends EntityBehaviour {
  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  distance = 50;
  distanceH = 100;
  speed = 0.19;
  t = 0;


  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;

    this.transform.setPosition(this.distanceH + x, this.distance, this.distanceH + z);
    this.transform.lookAt(vec3.create(), vec3.fromValues(0, 1, 0));
    const parentLight = (this.parent as DirectionalLight);
    if (parentLight.direction) {
      parentLight.direction.set(...this.transform.back)
    }
    this.t += this.speed * ellapsed;
  }
}


SceneManager.addDependency(LightMoveBehaviour.name, LightMoveBehaviour.instanciate);
