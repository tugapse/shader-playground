import { EntityBehaviour } from "./entity-behaviour";
import { Keybord, Mouse } from "../core/input";
import { vec3, quat } from 'gl-matrix'; // Import quat for quaternion operations

export class CameraFlyBehaviour extends EntityBehaviour {

  public moveSpeed = 2.0;
  public rotationSpeed = 0.1;

  override update(ellapsed: number): void {

    const transform = this.parent.transform;
    const effectiveMoveSpeed = this.moveSpeed * ellapsed;

    let deltaForward = 0;
    let deltaStrafe = 0;
    let deltaUpWorld = 0; // For vertical movement in world space

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
      deltaUpWorld = -1; // Move down in world space
    } else if (Keybord.keyDown['e']) {
      deltaUpWorld = 1; // Move up in world space
    }

    // --- Camera Rotation Logic (Mouse Input) ---
    if (Mouse.mouseButtonDown[0]) {
      const mouseXDelta = -Mouse.mouseMovement.x * this.rotationSpeed * ellapsed;
      const mouseYDelta = -Mouse.mouseMovement.y * this.rotationSpeed * ellapsed;

      // Apply Pitch (Up/Down Look): Rotate around the CAMERA'S LOCAL X-axis
      // This is done by post-multiplying the current rotation with a new X-axis rotation.
      // quat.rotateX(out, a, rad) takes a quaternion 'a' and applies rotation 'rad' around its X-axis.
      quat.rotateX(transform.rotation, transform.rotation, mouseYDelta);

      // Apply Yaw (Left/Right Look): Rotate around the WORLD'S UP (Y) axis
      // This is done by pre-multiplying the current rotation with a new World-Y rotation.
      // We create a new quaternion for this world-Y rotation.
      const worldYawQuat = quat.setAxisAngle(quat.create(), [0, 1, 0], mouseXDelta);
      quat.multiply(transform.rotation, worldYawQuat, transform.rotation);
    }
    // --- End Camera Rotation Logic ---


    // --- Camera Movement Logic ---
    const movementVector = vec3.create();

    // Forward/Backward movement along camera's current forward vector
    if (deltaForward !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.forward, deltaForward * effectiveMoveSpeed);
    }

    // Strafe Left/Right movement along camera's current right vector
    if (deltaStrafe !== 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.right, deltaStrafe * effectiveMoveSpeed);
    }

    // Vertical movement along world's Up vector (e.g., for flying straight up/down)
    if (deltaUpWorld !== 0) {
      const worldUp = vec3.fromValues(0, 1, 0); // World's Up direction
      vec3.scaleAndAdd(movementVector, movementVector, worldUp, deltaUpWorld * effectiveMoveSpeed);
    }

    // Apply the accumulated movement to the camera's position
    transform.translate(movementVector[0], movementVector[1], movementVector[2]);
    super.update(ellapsed);
  }
}
