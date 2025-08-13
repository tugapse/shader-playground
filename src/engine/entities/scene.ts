import { CameraFlyBehaviour } from "../behaviours/camera-fly-behaviour";
import { Transform } from "../core/transform";
import { Camera } from "./camera";
import { GlEntity } from "./entity";



export class Scene extends GlEntity {

  private static _currentScene: Scene;
  public static get currentScene() { return this._currentScene }

  private _camera: Camera
  private _objects: GlEntity[];
  private _initialized = false;
  private gl!: WebGLRenderingContext;
  private canvas!: HTMLCanvasElement

  public get camera(): Camera { return this._camera }
  public get objects(): GlEntity[] { return this._objects }

  constructor() {
    super("Scene", new Transform());
    this._camera = new Camera();
    this.camera.behaviours.push(new CameraFlyBehaviour(this.camera))
    this.camera.initialize()
    this._objects = []
    !Scene._currentScene && (Scene._currentScene = this);
  }

  public override initialize(): void {
    if (this._initialized) return;

    for (const object of this.objects) {
      object.initialize();
    }
    this._initialized = true;
  }

  public override update(ellapsed: number): void {
    this.camera.update(ellapsed)
    for (const object of this.objects) {
      object.update(ellapsed);
    }
  }

  public override draw(): void {

    if (!this.gl) return;


    this.gl.clearColor(0.44, 0.58, 0.85, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    for (const object of this.objects) {
      object.draw();
    }
  }

  public addEntity(entity: GlEntity): void {
    this.objects.push(entity);
  }

  public getObject(name: string): GlEntity | null {
    return this.objects.find(o => o.name === name) || null;
  }

  public setGlRenderingContext(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): void {
    this.gl = gl;
    this.canvas = canvas;
    this.addEvents();
  }

  private addEvents() {
  }

  public override destroy(): void {
    for (const child of this.objects) {
      child.destroy();
    }
  }

  public setCurrent(): void {

  }

}
