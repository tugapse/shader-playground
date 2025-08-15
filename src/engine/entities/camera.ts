import { Transform } from "../core/transform";
import { mat4 } from 'gl-matrix';
import { GlEntity } from "./entity";
import { CanvasViewport } from "@engine/core/canvas-viewport";

export class Camera extends GlEntity {

  public static _mainCamera: Camera;
  public static get mainCamera(): Camera { return this._mainCamera }

  public fieldOfView: number = (45 * Math.PI) / 180;
  public nearPlane: number = 0.1;
  public farPlane: number = 100.0;
  public aspectRatio: number = 1; // This needs to be updated

  private _projectionMatrix!: mat4;
  private _viewMatrix!: mat4;

  public override tag:string="Camera"

  public get projectionMatrix() { return this._projectionMatrix }
  public get viewMatrix() { return this._viewMatrix }

  constructor() {
    super("Camera")
    Camera._mainCamera = this;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create()
    this.transform.setPosition(0, 0, 10);
  }

  override initialize(): void {
    this.updateProjectionMatrix();
    this.updateViewMatrix();
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
   * The view matrix is the inverse of the camera's model matrix.
   */
  private updateViewMatrix() {
    mat4.invert(this._viewMatrix, this.transform.modelMatrix);
  }

  override update(ellapsed: number): void {
    this.updateViewMatrix();
    super.update(ellapsed);
  }
}
