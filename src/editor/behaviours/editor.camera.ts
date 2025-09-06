
import { vec3 } from "gl-matrix";
import { CameraFlyBehaviour, Transform, Mouse, JsonSerializedData } from "omega-game-engine";

export class EditorCameraBehaviour extends CameraFlyBehaviour {



  override get transform(): Transform {
    return this.parent.transform;
  }

  public scroolSpeed = 5;
  public initialPitch = 15;
  public initialYaw = -180;

  override initialize(): boolean {
    super.initialize();
    this.moveSpeed = 20.5;
    this.moveDampening = 0.1;
    this.rotationSpeed = 0.4;
    this.rotationDampening = 0.25;
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
