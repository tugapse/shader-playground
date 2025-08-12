import { EntityBehaviour } from "../core/entity-behaviour";
import { Keybord } from "../core/input";

export class CameraFlyBehaviour extends EntityBehaviour {

  public moveSpeed = 10.0;
  public dampningSpeed = 0.01;

  private moveControls = ["w", "s", "a", "d"];

  private velocityX = 0;
  private velocityZ = 0;
  private pressedValues: number[] = [0, 0, 0, 0];

  override initialize(): void {
  }

  override update(ellapsed: number): void {

    const pos = this.parent.transform.position;
    this.velocityX = 0;
    this.velocityZ = 0;

    if (Keybord.keyState['w'])
      this.velocityZ = -1;
    else if (Keybord.keyState['s'])
      this.velocityZ = 1;

    if (Keybord.keyState['a'])
      this.velocityX = -1;
    else if (Keybord.keyState['d'])
      this.velocityX = 1

    pos[0] += this.velocityX * this.moveSpeed * ellapsed;
    pos[2] += this.velocityZ * this.moveSpeed * ellapsed;

    this.parent.transform.translate(pos[0], pos[1], pos[2]);
    this.pressedValues = [0, 0, 0, 0]
  }

}
