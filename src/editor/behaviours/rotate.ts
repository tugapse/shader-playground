import { EntityBehaviour, JsonSerializedData, ObjectInstanciator, Vector3 } from '@engine';
import { ClassType } from '@engine/enums/class-type.enum';

export class RotateBehaviour extends EntityBehaviour {
  static override instanciate(): RotateBehaviour {
    return new RotateBehaviour();
  }
  protected override _className = 'RotateBehaviour';

  rotationAngle: Vector3 = new Vector3(0, 1, 0);
  speed = 0.005;

  public override update(ellapsed: number): void {
    const velocity = this.speed*ellapsed
    this.transform.rotate(
      this.rotationAngle.x * velocity, 
      this.rotationAngle.y * velocity,
      this.rotationAngle.z * velocity,
    );
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically()
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);  
  }
}

ObjectInstanciator.addDependency(
  'RotateBehaviour',
  RotateBehaviour.instanciate,
  {
    name: 'RotateBehaviour',
    type: ClassType.EntityBehaviour,
    path: 'Behaviours/RotateBehaviour',
    description: 'Continuously rotates the entity along its axis over time.',
  },
);
