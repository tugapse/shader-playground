
import { quat, vec3 } from "gl-matrix";
import { CameraFlyBehaviour, Keybord, Mouse, Transform } from "omega-game-engine";

export class EditorCameraBehaviour extends CameraFlyBehaviour {



  override get transform(): Transform {
    return this.parent.transform;
  }

  public scroolSpeed = 2;
  public initialPitch = 15;
  public initialYaw = -180;

  override initialize(): boolean {
    super.initialize();
    this.moveSpeed = 20.5;
    this.moveDampening = 0.2;
    this.rotationSpeed = 0.4;
    this.rotationDampening = 0.3;
    this._acceleration = 5;
    this._currentPitch = this.initialPitch;
    this._currentYaw = this.initialYaw;
    return true;
  }


  // protected override updateInput(ellapsed: number): void {
  //   if (!this._initialized || !this.parent?.transform) return;
  //   const transform = this.parent.transform;

  //   const accelerationDelta = this._acceleration * ellapsed;
  //   const maxSpeed = this.moveSpeed;
  //   const stopThreshold = 0.1; // Velocity below this will be set to 0 to prevent "creeping"

  //   // --- Update Forward/Backward Velocity (W/S Keys) ---
  //   if (Keybord.keyDown['w']) {
  //     this._forwardVelocity = Math.min(this._forwardVelocity + accelerationDelta, maxSpeed);
  //   } else if (Keybord.keyDown['s']) {
  //     this._forwardVelocity = Math.max(this._forwardVelocity - accelerationDelta, -maxSpeed);
  //   } else {
  //     // Apply dampening when no key is pressed for smooth deceleration
  //     this._forwardVelocity *= (1 - this.moveDampening);
  //     if (Math.abs(this._forwardVelocity) < stopThreshold) {
  //       this._forwardVelocity = 0; // Snap to 0 if very slow
  //     }
  //   }

  //   // --- Update Strafe Velocity (A/D Keys) ---
  //   if (Keybord.keyDown['a']) {
  //     this._strafeVelocity = Math.min(this._strafeVelocity + accelerationDelta, maxSpeed);
  //   } else if (Keybord.keyDown['d']) {
  //     this._strafeVelocity = Math.max(this._strafeVelocity - accelerationDelta, -maxSpeed);
  //   } else {
  //     // Apply dampening for smooth strafing stop
  //     this._strafeVelocity *= (1 - this.moveDampening);
  //     if (Math.abs(this._strafeVelocity) < stopThreshold) {
  //       this._strafeVelocity = 0;
  //     }
  //   }

  //   // --- Update Up/Down Velocity (Q/E Keys) ---
  //   if (Keybord.keyDown['q']) {
  //     this._upVelocity = Math.max(this._upVelocity - accelerationDelta, -maxSpeed);
  //   } else if (Keybord.keyDown['e']) {
  //     this._upVelocity = Math.min(this._upVelocity + accelerationDelta, maxSpeed);
  //   } else {
  //     // Apply dampening for smooth vertical stop
  //     this._upVelocity *= (1 - this.moveDampening);
  //     if (Math.abs(this._upVelocity) < stopThreshold) {
  //       this._upVelocity = 0;
  //     }
  //   }

  //   if (Mouse.mouseButtonDown[1]) {
  //     this._upVelocity += Mouse.mouseMovement.y * this.moveDampening / 2.0;
  //     this._strafeVelocity += Mouse.mouseMovement.x * this.moveDampening / 2.0;
  //   }

  //   if (Mouse.wheelY != 0) {
  //     this._forwardVelocity += -Mouse.wheelY * ellapsed * this.scroolSpeed;
  //   }
  //   // --- Camera Movement Logic ---
  //   const movementVector = vec3.create();

  //   // Scale and add movement components based on current velocities
  //   if (Math.abs(this._forwardVelocity) > 0) {
  //     vec3.scaleAndAdd(movementVector, movementVector, transform.forward, this._forwardVelocity);
  //   }
  //   if (Math.abs(this._strafeVelocity) > 0) {
  //     vec3.scaleAndAdd(movementVector, movementVector, transform.right, this._strafeVelocity);
  //   }
  //   if (Math.abs(this._upVelocity) > 0) {
  //     const worldUp = vec3.fromValues(0, 1, 0);
  //     vec3.scaleAndAdd(movementVector, movementVector, worldUp, this._upVelocity);
  //   }

  //   transform.translate(movementVector[0] * ellapsed, movementVector[1] * ellapsed, movementVector[2] * ellapsed);

  //   if (Mouse.mouseButtonDown[2]) {
  //     this._currentYaw += -Mouse.mouseMovement.x * this.rotationSpeed;
  //     this._currentPitch += Mouse.mouseMovement.y * this.rotationSpeed;
  //   }



  //   this._currentPitch = Math.max(-90, Math.min(90, this._currentPitch));

  //   const yawQuat = quat.create();
  //   quat.fromEuler(yawQuat, 0, this._currentYaw, 0);

  //   const pitchQuat = quat.create();
  //   quat.fromEuler(pitchQuat, this._currentPitch, 0, 0);

  //   const finalRotation = quat.create();
  //   quat.multiply(finalRotation, yawQuat, pitchQuat);

  //   const smoothedRotation = quat.create();
  //   quat.slerp(smoothedRotation, transform.rotationQuat, finalRotation, this.rotationDampening);
  //   transform.setRotationQuat(smoothedRotation);
  // }


}
