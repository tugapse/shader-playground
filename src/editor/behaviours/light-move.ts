import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { DirectionalLight } from "@engine/entities/light";
import { SceneManager } from "@engine/entities/scene-manager";
import { mat4, vec3 } from "gl-matrix";


export class LightMoveBehaviour extends EntityBehaviour {
  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  speed = 0.9;
  t = 0;
  nextDir: vec3 = vec3.create();


  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;
    this.transform.setRotation(30,this.t,0);
    this.t += this.speed * ellapsed;
  }
}


SceneManager.addDependency(LightMoveBehaviour.name, LightMoveBehaviour.instanciate);
