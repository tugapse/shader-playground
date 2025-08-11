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


  public static VIEWPORT: { x: number, y: number, width: number, height: number }

  private _projectionMatrix!: mat4;
  private _viewMatrix!: mat4;


  public get projectionMatrix() { return this._projectionMatrix }
  public get viewMatrix() { return this._viewMatrix }

  constructor(){
    super("Camera",new Transform())
    Camera._mainCamera = this;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create()
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
  }

  override update(ellapsed: number): void {

  }



}
