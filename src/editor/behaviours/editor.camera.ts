import { CameraFlyBehaviour } from "@engine/behaviours";
import { Vector3 } from "@engine/core/vector";
import { vec3 } from "gl-matrix";

export class EditorCameraBehaviour extends CameraFlyBehaviour {


  override initialize(): boolean {
    super.initialize();
    this.moveSpeed = 20.5;
    this.rotationSpeed = 0.5;
    this.rotationDampening = 0.2;
    this.transform.setDirty(true);

    return true;
  }
}
