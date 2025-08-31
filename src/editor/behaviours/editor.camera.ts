import { CameraFlyBehaviour } from "@engine/behaviours";
import { Transform } from "@engine/core";
import { Mouse } from "@engine/core/input";
import { vec3 } from "gl-matrix";

export class EditorCameraBehaviour extends CameraFlyBehaviour {

  override get transform(): Transform {
    if(!this.parent) debugger;
    return this.parent.transform;
  }

  public scroolSpeed = 5;
  public initialPitch = 15;
  public initialYaw = -180;

  override initialize(): boolean {
    super.initialize();
    this.moveSpeed = 20.5;
    this.moveDampening = 0.1;
    this.rotationSpeed = 0.5;
    this.rotationDampening = 0.15;
    this._acceleration = 8;
    this._currentPitch = this.initialPitch;
    this._currentYaw = this.initialYaw;
    return true;
  }

  override update(ellapsed: number): void {
    super.update(ellapsed);
    if (Mouse.wheelY != 0) {
      this._forwardVelocity += -Mouse.wheelY * ellapsed * this.scroolSpeed;
    }
  }
}
