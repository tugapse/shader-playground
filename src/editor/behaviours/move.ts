import { EntityBehaviour, ObjectInstanciator } from "@engine";
import { ClassType } from "@engine/enums/class-type.enum";



export class MoveBehaviour extends EntityBehaviour {

  static override instanciate(): MoveBehaviour {
    return new MoveBehaviour()
  }
  protected override _className = "MoveBehaviour";

  distance = 10;
  speed = 0.9;
  t = 1;

  public override update(ellapsed: number): void {
    const x = Math.sin(this.t) * this.speed;
    const z = Math.cos(this.t) * this.speed;

    this.transform.setWorldPosition(this.distance * x,
      0,
      this.distance * z);
    // this.parent.transform.updateModelMatrix();
    this.t += this.speed * ellapsed;
  }
}

ObjectInstanciator.addDependency("MoveBehaviour", MoveBehaviour.instanciate, {
  name: "MoveBehaviour",
  type: ClassType.EntityBehaviour,
  path: "Behaviours/MoveBehaviour",
  description: "Continuously moves the entity in a circular path over time."
});
