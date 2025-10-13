import { EntityBehaviour, ObjectInstanciator } from "@engine";



export class RotateBehaviour extends EntityBehaviour {

  static override instanciate(): RotateBehaviour {
    return new RotateBehaviour();
  }
  protected override _className = "RotateBehaviour";


  speed = 0.005;
  public override update(ellapsed: number): void {
    this.transform.rotate(
      0 * this.speed, // 1 * this.speed,
      0, //1 * this.speed,
      1 * this.speed
    );
  }
}
ObjectInstanciator.addDependency("RotateBehaviour", RotateBehaviour.instanciate);
