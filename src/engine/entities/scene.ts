import { CameraFlyBehaviour } from "../behaviours/camera-fly-behaviour";
import { Transform } from "../core/transform";
import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Light } from "./light";



export class Scene extends GlEntity {

  private static _currentScene: Scene;
  public static get currentScene() { return this._currentScene }

  public override tag: string = "Scene";

  private _camera: Camera
  private _objects: GlEntity[];
  private _lights: Light[];
  private _initialized = false;
  private gl!: WebGLRenderingContext;
  private canvas!: HTMLCanvasElement

  public get camera(): Camera { return this._camera }
  public get objects(): GlEntity[] { return this._objects }
  public get lights(): Light[] { return this._lights }

  constructor() {
    super("Scene");
    this._camera = new Camera();
    this.camera.behaviours.push(new CameraFlyBehaviour(this.camera))
    this.camera.initialize()

    this._objects = [];
    this._lights = [];

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
      // const t  = object.transform;
      // t.rotate(1*ellapsed,0,2*ellapsed);
      object.update(ellapsed);
    }
  }

  public override draw(): void {

    if (!this.gl) return;

    this.gl.clearColor(0.44, 0.58, 0.85, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    for (const object of this.objects) {
      object.draw();
    }
  }

  public addEntity(entity: GlEntity) {

    if (this._initialized) entity.initialize()

    entity.scene = this;
    if (entity instanceof Light) {
      this._lights.push(entity);
    } else {
      this._objects.push(entity);
    }
  }

  public setGlRenderingContext(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): void {
    this.gl = gl;
    this.canvas = canvas;
  }


  public override destroy(): void {
    for (const child of this.objects) {
      child.destroy();
    }
  }

  public setCurrent(): void {
    Scene._currentScene = this;
  }

  public getEntitiesByTag(tag: string): GlEntity[] {
    return this.objects.filter(o => o.tag == tag);
  }

  public getEntityByName(name: string): GlEntity | null {
    return this.objects.find(o => o.name === name) || null;
  }
  /**
    * Retrieves entities of a specific type from the collection.
    * T must be a type that extends GLEntity.
    * @param constructor The constructor function of the type to filter by (e.g., GLErrorEntity).
    * @returns An array of entities of the specified type.
    */
  public getEntities<T extends GlEntity>(constructor: new (...args: any[]) => T): T[] {
    return this._objects.filter((o): o is T => o instanceof constructor);
  }


}
