import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { DirectionalLight } from "@engine/entities/light";
import { SceneManager } from "@engine/entities/scene-manager";
import { mat4, vec3 } from "gl-matrix";


export class LightMoveBehaviour extends EntityBehaviour {
  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  distance = 5;
  distanceH = 10;
  speed = 0.19;
  t = 0;
  nextDir: vec3 = vec3.create();


  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;
    this.transform.setRotation(x,1,z);
    this.t += this.speed * ellapsed;
  }
}


SceneManager.addDependency(LightMoveBehaviour.name, LightMoveBehaviour.instanciate);
