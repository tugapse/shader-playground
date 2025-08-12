import { EntityBehaviour } from "../core/entity-behaviour";
import { Keybord } from "../core/input";
import { vec3 } from 'gl-matrix'; // Import vec3 for vector operations

export class CameraFlyBehaviour extends EntityBehaviour {

  public moveSpeed = 10.0;

  override update(ellapsed: number): void {

    const transform = this.parent.transform;
    const effectiveMoveSpeed = this.moveSpeed * ellapsed;
    const effectiveRotationSpeed = 2 * ellapsed;

    let deltaForward = 0;
    let deltaStrafe = 0;
    let deltaRotationY = 0;

    // Movement Input
    if (Keybord.keyState['w']) {
      deltaForward = 1;
    } else if (Keybord.keyState['s']) {
      deltaForward = -1;
    }

    if (Keybord.keyState['a']) {
      deltaStrafe = -1;
    } else if (Keybord.keyState['d']) {
      deltaStrafe = 1;
    }

    if (Keybord.keyState['q']) {
      deltaRotationY = 1;
    } else if (Keybord.keyState['e']) {
      deltaRotationY = -1;
    }

    const movementVector = vec3.create();

    if (deltaForward !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.forward, deltaForward * effectiveMoveSpeed);
    }

    if (deltaStrafe !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.right, deltaStrafe * effectiveMoveSpeed);
    }

    transform.translate(movementVector[0], movementVector[1], movementVector[2]);


    if (deltaRotationY !== 0) {
      transform.rotate(0, deltaRotationY * effectiveRotationSpeed, 0);
    }
  }
}
