import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { ObjectInstanciator } from "@engine/core/object-instanciator";
import { Vector3 } from "@engine/core/vector";
import { SceneManager } from "@engine/entities/scene-manager";


export class LightMoveBehaviour extends EntityBehaviour {
  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  public rotationSpeed = 1.5;
  public rotation = new Vector3();
  _t = 0;


  public override update(ellapsed: number): void {

    this.transform.setRotation(this.rotation.x, this.rotation.y * this._t, this.rotation.z);
    this._t += this.rotationSpeed * ellapsed;
  }
}


ObjectInstanciator.addDependency(LightMoveBehaviour.name, LightMoveBehaviour.instanciate);
