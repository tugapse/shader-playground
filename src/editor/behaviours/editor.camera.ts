import { CameraFlyBehaviour } from "@engine/behaviours";

export class EditorCameraBehaviour extends CameraFlyBehaviour {


  override initialize(): boolean {
    super.initialize();
    this.moveSpeed = 20.5;
    this.rotationSpeed = 0.5;
    this.rotationDampening = 0.2;
    this.transform.setDirty(true);
    this._acceleration = 6;

    return true;
  }
}
