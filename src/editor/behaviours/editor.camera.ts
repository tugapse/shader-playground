import { CameraFlyBehaviour } from "@engine/behaviours";

export class EditorCameraBehaviour extends CameraFlyBehaviour {

  override initialize(): boolean {
    this.moveSpeed = 10;
    this.rotationSpeed = 0.35;
    this.rotationDampening = 0.2;
    return super.initialize();
  }
}
