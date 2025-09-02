import { EntityBehaviour, Vector3, ObjectInstanciator } from "omega-game-engine";

export class LightMoveBehaviour extends EntityBehaviour {

  static override instanciate(): LightMoveBehaviour {
    return new LightMoveBehaviour()
  }

  protected override _className = "LightMoveBehaviour";

  public rotationSpeed = 1.5;
  public rotation = new Vector3();
  public hour = 0;
  public min = 0;
  public sec = 0;
  public timeString = "";

  public isNight = false;

  _t = 0;

  public override update(ellapsed: number): void {
    this._t += this.rotationSpeed * ellapsed;
    const x = Math.sin(this._t) * Math.PI* 2;
    const y = Math.cos(this._t) * Math.PI* 2;
    this.isNight = y <= 0;

    let now = 0;
    if (this.isNight)
      now = 2 - (((x + 1) * 0.5))
    else
      now = (((x + 1) * 0.5))

    this.hour = Math.floor(5 + now*12)%24;
    this.min = Math.floor(this.hour / 60);
    this.sec = Math.floor(this.min / 60);
    this.timeString = `${this.hour}:${this.min}:${this.sec}`
    this.transform.setRotation(this.rotation.x + x, this.rotation.y + y, this.rotation.z);
  }
}


ObjectInstanciator.addDependency("LightMoveBehaviour", LightMoveBehaviour.instanciate);
