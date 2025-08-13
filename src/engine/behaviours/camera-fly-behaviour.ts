import { EntityBehaviour } from "./entity-behaviour";
import { Keybord, Mouse } from "../core/input";
import { vec3 } from 'gl-matrix'; // Import vec3 for vector operations

export class CameraFlyBehaviour extends EntityBehaviour {

  public moveSpeed = 5.0;
  public rotationSpeed = 0.1;

  override update(ellapsed: number): void {

    const transform = this.parent.transform;
    const effectiveMoveSpeed = this.moveSpeed * ellapsed;
    const effectiveRotationSpeed = 2 * ellapsed;

    let deltaForward = 0;
    let deltaStrafe = 0;
    let deltaRotationY = 0;
    let deltaUp = 0;

    // Movement Input
    if (Keybord.keyDown['w']) {
      deltaForward = 1;
    } else if (Keybord.keyDown['s']) {
      deltaForward = -1;
    }

    if (Keybord.keyDown['a']) {
      deltaStrafe = -1;
    } else if (Keybord.keyDown['d']) {
      deltaStrafe = 1;
    }

    if (Keybord.keyDown['q']) {
      deltaUp = -1;
    } else if (Keybord.keyDown['e']) {
      deltaUp = 1;
    }

    if (Mouse.mouseButtonDown[0]) {
      transform.rotate(
        -Mouse.mouseMovement.y * this.rotationSpeed * ellapsed,
        -Mouse.mouseMovement.x * this.rotationSpeed * ellapsed,
        0);
    }

    const movementVector = vec3.create();

    if (deltaForward !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.forward, deltaForward * effectiveMoveSpeed);
    }

    if (deltaStrafe !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.right, deltaStrafe * effectiveMoveSpeed);
    }

    if (deltaUp !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.up, deltaUp * effectiveMoveSpeed);
    }

    transform.translate(movementVector[0], movementVector[1], movementVector[2]);


    if (deltaRotationY !== 0) {
      transform.rotate(0, deltaRotationY * effectiveRotationSpeed, 0);
    }
  }
}
