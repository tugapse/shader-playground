import { quat2, vec3 } from "gl-matrix";
import { EntityBehaviour, Vector3, ObjectInstanciator, Camera } from "@engine";

export class SunBehaviour extends EntityBehaviour {

  static override instanciate(): SunBehaviour {
    return new SunBehaviour()
  }

  protected override _className = "LightMoveBehaviour";

  public rotationSpeed = 0.5;
  private center = vec3.create();
  private up = vec3.fromValues(0, 1, 0);
  public distance = 1000000;
  public height = 50;
  public rotationAmount = 0;

  _rotation = new Vector3();
  _timeString = "";

  public isNight = false;

  _t = 10;

  constructor() {
    super();
  }

  override initialize(): boolean {
    super.initialize();
    this.update(this._t);
    return true;
  }

  public override update(ellapsed: number): void {
    this.rotationAmount += ellapsed * this.rotationSpeed;

    if (this.height > 190) this.height = 190;
    if (this.height < -190) this.height = -190;
    this.rotationAmount = this.rotationAmount % 360;


    const x = Math.cos(this.rotationAmount);
    const z = Math.sin(this.rotationAmount);

    const mappedHeight = (-this.height + 180) / 360 * this.distance * 2 - this.distance;

    this.transform.worldPosition = [x * this.distance, mappedHeight, z * this.distance];

    this.isNight = this.height <= 0;

    this.transform.lookAt(this.center, this.up)
  }



}



ObjectInstanciator.addDependency("LightMoveBehaviour", SunBehaviour.instanciate);
