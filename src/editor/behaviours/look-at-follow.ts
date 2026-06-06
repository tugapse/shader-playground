import { EntityBehaviour, GlEntity, JsonSerializedData, ObjectInstanciator } from "@engine";
import { ClassType } from "@engine/enums/class-type.enum";


export class LookAtFollowBehaviour extends EntityBehaviour {

  static override instanciate(): LookAtFollowBehaviour {
    return new LookAtFollowBehaviour();
  }
    protected override _className = "LookAtFollowBehaviour";


  private target!: GlEntity | undefined;
  public targetId!: string;
  public followTarget = false;
  public followVelocity = 0.35;

  override initialize(): boolean {
    if (this.target) return true;
    this.target = this.parent.scene.getEntitieByUuid(this.targetId);
    return !!this.target;
  }

  override update(ellapsed: number): void {
    if (!this.target) this.initialize();
    if (this.target) {
      this.transform.lookAt(this.target.transform.worldPosition);
      this.transform.updateMatrices();
      if (this.followTarget) {
        const dir = this.transform.forward;
        this.transform.translate(dir[0] * this.followVelocity, dir[1] * this.followVelocity,
          dir[2] * this.followVelocity);
      }
    }

  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.targetId = jsonObject['targetId'];
    this.followTarget = jsonObject['followTarget'];
    this.followVelocity = jsonObject['followVelocity'];

  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      followTarget: this.followTarget,
      targetId: this.targetId,
      followVelocity: this.followVelocity

    }
  }
}

ObjectInstanciator.addDependency("LookAtFollowBehaviour", LookAtFollowBehaviour.instanciate, {
  name: "LookAtFollowBehaviour",
  type: ClassType.EntityBehaviour,
  path: "Behaviours/LookAtFollowBehaviour",
  description: "Makes the entity automatically look at and optionally follow a target entity."
});
