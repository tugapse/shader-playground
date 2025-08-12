import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Transform } from "./transform";

export class Scene extends GlEntity {

  private static _currentScene: Scene;
  public static get currentScene() { return this._currentScene }

  private _camera: Camera
  private _objects: GlEntity[];
  private _initialized = false;


  public get camera(): Camera { return this._camera }
  public get objects(): GlEntity[] { return this._objects }

  constructor(private gl: WebGLRenderingContext | null = null) {
    super("Scene", new Transform());
    this._camera = new Camera();
    this.camera.initialize()
    this._objects = []
    !Scene._currentScene && (Scene._currentScene = this);
  }

  public override initialize(): void {
    if(this._initialized) return;

    for (const object of this.objects) {
      object.initialize();
    }
    this._initialized = true;
  }

  public override update(ellapsed: number): void {
    for (const object of this.objects) {
      object.update(ellapsed);
    }
  }

  public override draw(): void {

    if (!this.gl) return;


    this.gl.clearColor(0.3, 0.6, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    for (const object of this.objects) {
      object.draw();
    }
  }

  public addEntity(entity:GlEntity):void{
    this.objects.push(entity);
  }

  public getObject(name: string): GlEntity | null {
    return this.objects.find(o => o.name === name) || null;
  }

  public setGlRenderingContext(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  public override destroy(): void {
    for (const child of this.objects) {
      child.destroy();
    }
  }

  public setCurrent(): void {

  }

}
