import { EntityBehaviour, Vector3, ObjectInstanciator } from "omega-game-engine";

export class LightMoveBehaviour extends EntityBehaviour {

  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  protected override _className = "LightMoveBehaviour";

  public rotationSpeed = 0.5;

  _rotation = new Vector3();
  _hour = 0;
  _min = 0;
  _sec = 0;
  _timeString = "";

  public isNight = false;

  _t = 0;

  public override update(ellapsed: number): void {
    this._t += this.rotationSpeed * ellapsed;
    const x = Math.sin(this._t) * Math.PI * 2;
    const y = Math.cos(this._t) * Math.PI * 2;
    this.isNight = y <= 0;

    let now = 0;
    if (this.isNight)
      now = 2 - (((x + 1) * 0.5))
    else
      now = (((x + 1) * 0.5))

    this._hour = Math.floor(5 + now * 12) % 24;
    this._min = Math.floor(this._hour / 60);
    this._sec = Math.floor(this._min / 60);
    this._timeString = `${this._hour}:${this._min}:${this._sec}`
    this.transform.setRotation(this._rotation.x + x, this._rotation.y + y, this._rotation.z);
  }
}


ObjectInstanciator.addDependency("LightMoveBehaviour", LightMoveBehaviour.instanciate);
