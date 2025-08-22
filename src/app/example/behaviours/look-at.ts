import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { GlEntity } from "@engine/entities/entity";
import { SceneManager } from "@engine/entities/scene-manager";

export class LookAtBehaviour extends EntityBehaviour {
  static override instanciate(): LookAtBehaviour {
    return new LookAtBehaviour();
  }

  private target!: GlEntity | undefined;
  public targetId!: string;
  public follow = false;
  public followVelocity = 0.35;

  override initialize(): boolean {
    if (this.target) return true;
    this.target = this.parent.scene.getEntitieByUuid(this.targetId);
    return !!this.target;
  }

  override update(ellapsed: number): void {
    if (!this.target) this.initialize();
    if (this.target) {
      this.transform.lookAt(this.target.transform.position);
      this.transform.updateMatrices();
      if (this.follow) {
        const dir = this.transform.forward;
        this.transform.translate(dir[0]*this.followVelocity, dir[1]*this.followVelocity,
           dir[2]*this.followVelocity);
      }
    }

  }
}
SceneManager.addDependency(LookAtBehaviour.name, LookAtBehaviour.instanciate);
