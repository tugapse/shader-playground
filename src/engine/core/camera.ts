import { GlEntity } from "./entity";

export class Camera extends GlEntity {

  public static _mainCamera: Camera;
  public static get mainCamera(): Camera { return this._mainCamera }

  public fieldOfView: number = 45;
  public nearPlane: number = 10;
  public nearfarPlane: number = 100;

  public static VIEWPORT: { x: number, y: number, width: number, height: number }

}
