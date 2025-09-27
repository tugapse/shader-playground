import { quat2, vec3 } from "gl-matrix";
import { EntityBehaviour, Vector3, ObjectInstanciator, Camera } from "omega-game-engine";

export class LightMoveBehaviour extends EntityBehaviour {

  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  protected override _className = "LightMoveBehaviour";

  public rotationSpeed = 0.5;
  private center = vec3.create();
  private up = vec3.fromValues(0, 1, 0);
  public distance = 5;

  _rotation = new Vector3();
  _timeString = "";

  public isNight = false;

  _t = 0;

  public override update(ellapsed: number): void {


    this._t += this.rotationSpeed * ellapsed;
    const x = Math.cos(this._t) * Math.PI * 2;
    const z = Math.sin(this._t) * Math.PI * 2;
    // this.isNight = z <= 0;

    this.transform.setPosition(x * this.distance, this.distance , z * this.distance);
    this.transform.updateMatrices();
    this.transform.lookAt(this.center,this.up)
  }



}



ObjectInstanciator.addDependency("LightMoveBehaviour", LightMoveBehaviour.instanciate);
