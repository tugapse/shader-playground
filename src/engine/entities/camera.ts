import { Transform } from "../core/transform";
import { mat4 } from 'gl-matrix';
import { GlEntity } from "./entity";

export class Camera extends GlEntity {

  public static _mainCamera: Camera;
  public static get mainCamera(): Camera { return this._mainCamera }

  public fieldOfView: number = (45 * Math.PI) / 180;
  public nearPlane: number = 0.1;
  public farPlane: number = 100.0;
  public aspectRatio: number = 1;

  private _projectionMatrix!: mat4;
  private _viewMatrix!: mat4;

  public override tag:string="Camera"

  public get projectionMatrix() { return this._projectionMatrix }
  public get viewMatrix() { return this._viewMatrix }

  constructor() {
    super("Camera", new Transform())
    Camera._mainCamera = this;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create()
    this.transform.setPosition(0, 0, 10); // Set an initial position for the camera
    // No need to setRotation(0, 0, 0) explicitly here; quat.create() already makes it an identity rotation.
  }

  override initialize(): void {
    // The projection matrix is typically set once (or on window resize)
    mat4.perspective(
      this._projectionMatrix,
      this.fieldOfView,
      this.aspectRatio,
      this.nearPlane,
      this.farPlane
    );
    // Ensure the initial view matrix is set based on the transform's initial state
    this.updateViewMatrix();
    super.initialize();
  }

  /**
   * Updates the camera's view matrix based on its current transform (position and rotation).
   * The view matrix is the inverse of the camera's model matrix.
   */
  private updateViewMatrix() {
    // The this.transform.modelMatrix is already correctly updated by CameraFlyBehaviour
    // (which calls transform.updateModelMatrix()) when the camera moves or rotates.
    // Here, we just need to invert that already-computed model matrix to get the view matrix.
    mat4.invert(this._viewMatrix, this.transform.modelMatrix);
  }

  override update(ellapsed: number): void {
    // The CameraFlyBehaviour (or other behaviours attached to the Camera entity)
    // will update this.transform.position and this.transform.rotation,
    // and critically, call this.transform.updateModelMatrix().
    // So, in the Camera's own update, we just need to update its _viewMatrix
    // based on the already updated this.transform.modelMatrix.
    this.updateViewMatrix();
    super.update(ellapsed); // Call parent update, which processes behaviours like CameraFlyBehaviour
  }
}
