import { Transform } from "../core/transform";
import { mat4, vec3 } from 'gl-matrix'; // Import vec3 for lookAt calculations
import { GlEntity } from "./entity";
import { CanvasViewport } from "@engine/core/canvas-viewport"; // Assuming this is used for aspect ratio
import { SceneManager } from "./scene-manager";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { EntityType } from "@engine/enums/entity-type";

export class Camera extends GlEntity {

  private static _mainCamera: Camera;
  public static get mainCamera(): Camera { return this._mainCamera }

  public fieldOfView: number = (45 * Math.PI) / 180;
  public nearPlane: number = 0.1;
  public farPlane: number = 2000.0;
  public aspectRatio: number = 1; // This needs to be updated, perhaps by CanvasViewport

  private _projectionMatrix!: mat4;
  private _viewMatrix!: mat4;

  public override tag: string = "Camera"

  public get projectionMatrix() { return this._projectionMatrix }
  public get viewMatrix() { return this._viewMatrix }

  constructor() {
    super("Camera")
    this.entityType = EntityType.CAMERA;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create()
    }

   static setMainCamera(camera: Camera) {
    this._mainCamera = camera;
  }


  override initialize(): void {
    // It's good practice to set initial aspect ratio here if CanvasViewport is available
    // For example: this.aspectRatio = CanvasViewport.width / CanvasViewport.height;
    this.updateProjectionMatrix();
    this.updateViewMatrix(); // Ensure view matrix is updated on initialization
    super.initialize();
  }

  /**
   * Updates the camera's projection matrix based on its current fieldOfView, aspectRatio, nearPlane, and farPlane.
   * This should be called whenever the canvas/viewport dimensions change.
   */
  public updateProjectionMatrix(): void {
    mat4.perspective(
      this._projectionMatrix,
      this.fieldOfView,
      this.aspectRatio,
      this.nearPlane,
      this.farPlane
    );
  }

  /**
   * Updates the camera's view matrix based on its current transform (position and rotation).
   * This method now explicitly uses mat4.lookAt to align the camera's view correctly,
   * considering that the Transform class's 'forward' is now +Z.
   */
  private updateViewMatrix() {
    const cameraPosition = this.transform.position; // The 'eye' position of the camera

    // Calculate the 'center' point the camera is looking at.
    // Since our Transform's 'forward' is +Z, we add this vector to the camera's position
    // to get the point directly in front of the camera's 'front face'.
    const lookAtTarget = vec3.add(vec3.create(), cameraPosition, this.transform.forward);

    // The 'up' direction for the camera. This should be consistent with the Transform's 'up' (+Y).
    const cameraUp = this.transform.up;

    // Use mat4.lookAt to generate the view matrix. This function expects the camera
    // to be looking down its own local negative Z-axis. By providing the
    // 'eye', 'center', and 'up' vectors, we ensure the view matrix is correctly
    // oriented to look from the camera's position towards the calculated target.
    mat4.lookAt(this._viewMatrix, cameraPosition, lookAtTarget, cameraUp);
  }

  override update(ellapsed: number): void {
    // Ensure projection matrix is updated if aspect ratio changes (e.g., window resize)
    // this.updateProjectionMatrix(); // Consider calling this here if aspect ratio is dynamic
    this.updateViewMatrix(); // Always update view matrix as camera moves
    super.update(ellapsed);

  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      fieldOfView: this.fieldOfView,
      nearPlane: this.nearPlane,
      farPlane: this.farPlane,
      aspectRatio: this.aspectRatio,
    }
  }

  static override instanciate(name?: string, transform?: Transform): Camera {
    const camera = new Camera();
    camera.name = name || camera.name;
    camera.transform = transform || camera.transform;
    return camera;
  }
}


