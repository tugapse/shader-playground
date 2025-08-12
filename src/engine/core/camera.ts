import { GlEntity } from "./entity";
import { mat4 } from 'gl-matrix';
import { Transform } from "./transform";

export class Camera extends GlEntity {

  public static _mainCamera: Camera;
  public static get mainCamera(): Camera { return this._mainCamera }

  public fieldOfView: number = (45 * Math.PI) / 180;
  public nearPlane: number = 0.1;
  public farPlane: number = 100.0;
  public aspectRatio: number = 1;

  private _projectionMatrix!: mat4;
  private _viewMatrix!: mat4;


  public get projectionMatrix() { return this._projectionMatrix }
  public get viewMatrix() { return this._viewMatrix }

  constructor() {
    super("Camera", new Transform())
    Camera._mainCamera = this;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create()
    this.transform.translate(0, 0, 10);
    this.transform.rotate(0, 0, 0);
  }

  override initialize(): void {
    mat4.identity(this._projectionMatrix);
    mat4.identity(this._viewMatrix);

    mat4.perspective(
      this._projectionMatrix,
      this.fieldOfView, // Field of view (fovy)
      this.aspectRatio, // Aspect ratio
      this.nearPlane, // Near clipping plane
      this.farPlane // Far clipping plane
    );

    const cameraModelMatrix = mat4.create();
    // Build the camera's model matrix based on its transform.
    mat4.translate(cameraModelMatrix, cameraModelMatrix, this.transform.position);
    mat4.rotateX(cameraModelMatrix, cameraModelMatrix, this.transform.rotation[0]);
    mat4.rotateY(cameraModelMatrix, cameraModelMatrix, this.transform.rotation[1]);
    mat4.rotateZ(cameraModelMatrix, cameraModelMatrix, this.transform.rotation[2]);

    // The view matrix is the inverse of the camera's model matrix.
    // This effectively "moves the world" opposite to the camera's movements.
    mat4.invert(this._viewMatrix, cameraModelMatrix);
  }

  override update(ellapsed: number): void {

  }



}
