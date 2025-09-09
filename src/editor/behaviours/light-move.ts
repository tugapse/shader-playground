import { EntityBehaviour, Vector3, ObjectInstanciator } from "omega-game-engine";

export class LightMoveBehaviour extends EntityBehaviour {

  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  protected override _className = "LightMoveBehaviour";

  public rotationSpeed = 0.5;

  _rotation = new Vector3();
  _timeString = "";

  public isNight = false;

  _t = 0;

  public override update(ellapsed: number): void {
    this._t += this.rotationSpeed * ellapsed;
    const x = Math.sin(this._t) * Math.PI * 2;
    const y = Math.cos(this._t) * Math.PI * 2;
    this.isNight = y <= 0;
    this.transform.setRotation(this._rotation.x + x, this._rotation.y + y, this._rotation.z);
    this.transform.setPosition(this._rotation.x + x, this._rotation.y + y, this._rotation.z + x-y);

  }
}


ObjectInstanciator.addDependency("LightMoveBehaviour", LightMoveBehaviour.instanciate);
