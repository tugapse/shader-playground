import { RenderMeshBehaviour } from "@engine/behaviours/renderer/render-mesh-behaviour";
import { MeshData } from "@engine/core/mesh";
import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Light } from "./light";
import { SceneManager } from "./scene-manager";
import { EntityBehaviour } from "@engine/behaviours/entity-behaviour";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";



export class Scene extends GlEntity {

  private static _currentScene: Scene;
  public static get currentScene() { return this._currentScene }

  public isEditorMode: boolean = false;
  public override tag: string = "Scene";

  private _camera!: Camera
  private _objects: GlEntity[];
  private _lights: Light[];
  private gl!: WebGL2RenderingContext;
  private canvas!: HTMLCanvasElement

  public get camera(): Camera { return this._camera }
  public get objects(): GlEntity[] { return this._objects }
  public get lights(): Light[] { return this._lights }

  constructor() {
    super("Scene");
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
    super.initialize();
    this.checkMainCamera();
  }

  public override update(ellapsed: number): void {
    this.camera.update(ellapsed)
    for (const object of this.lights) {
      object.update(ellapsed);
    }
    for (const object of this.objects) {
      object.update(ellapsed);
    }

    super.update(ellapsed);
  }

  private checkMainCamera() {
    if (!this._camera) {
      const camera = this.objects.find(e => e instanceof Camera);
      this._camera = camera || new Camera();
      this._camera.scene = this;
    }
  }

  public override draw(): void {

    if (!this.gl) return;

    this.gl.clearColor(0.44, 0.58, 0.85, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    for (const object of this.objects) {
      object.draw();
    }
    super.draw();
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

  public setGlRenderingContext(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
    this.gl = gl;
    this.canvas = canvas;
  }


  public override destroy(): void {
    for (const child of this.lights) {
      child.destroy();
    }
    for (const child of this.objects) {
      child.destroy();
    }
    this._objects = [];
    this._lights = [];
    super.destroy();
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    SceneManager.registerDependencies();
    this.destroy();
    super.fromJson(jsonObject);

    const { meshMaps, lights, objects } = jsonObject;
    const meshes: { [key: string]: MeshData } = {};

    for (const data of Object.values(meshMaps) as any[]) {
      const mData = new MeshData([]);
      mData.fromJson(data);
      meshes[data['uuid']] = mData;
    }

    this._objects = objects.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      e.behaviours.forEach((behaviourJsonData: any) => {
        // get the actual mesh from id
        if (behaviourJsonData.mesh) {
          behaviourJsonData['meshData'] = meshMaps[behaviourJsonData.mesh.meshDataId];
        }

        const newBehaviour = SceneManager.instanciateObjectFromJsonData(behaviourJsonData.type, [this.gl]);
        if (newBehaviour) {
          newBehaviour.fromJson(behaviourJsonData);
          entity.addBehaviour(newBehaviour);
        } else {
          console.warn("Implement behaviour instance");
        }
      });
      entity.fromJson(e);
      entity.scene = this;
      return entity;
    });

    this._lights = lights.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      entity.fromJson(e);
      entity.scene = this;
      return entity;
    });

    this.initialize();
  }

  public override toJsonObject(): JsonSerializedData {
    const meshMaps: { [key: string]: any } = {}
    const renderers = this.objects.filter(e => e.getBehaviour(RenderMeshBehaviour)).map(o => o.getBehaviour(RenderMeshBehaviour) as RenderMeshBehaviour);
    for (const renderer of renderers) {
      meshMaps[renderer.mesh.meshData.uuid] = renderer.mesh.meshData.toJsonObject();
    }
    return {
      ...super.toJsonObject(),
      lights: this.lights.map(o => o.toJsonObject()),
      objects: this.objects.map(o => o.toJsonObject()),
      meshMaps: meshMaps,
    }
  }

  public setCurrent(): void {
    Scene._currentScene = this;
  }

  public getEntitiesByTag(tag: string): GlEntity[] {
    return this.objects.filter(o => o.tag == tag);
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
