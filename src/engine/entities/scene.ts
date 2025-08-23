import { RenderMeshBehaviour } from "@engine/behaviours/renderer/render-mesh-behaviour";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Light } from "./light";
import { EntityType } from "@engine/enums/entity-type";



export class Scene extends GlEntity {

  private static _currentScene: Scene;
  public static get currentScene() { return this._currentScene }

  public isRunning: boolean = false;
  public color: vec3 = vec3.fromValues(0.2, 1, 0.2);
  public override tag: string = "Scene";
  override entityType: number = EntityType.SCENE;

  private _objects: GlEntity[];
  private gl!: WebGL2RenderingContext;
  private ellapsedTime = 0;

  public get objects(): GlEntity[] { return this._objects }
  public get lights(): Light[] { return this._objects.filter(o => o instanceof Light) }

  constructor() {
    super("Scene");
    this._objects = [];

    !Scene._currentScene && (Scene._currentScene = this);

  }

  public override initialize(): void {

    for (const object of this.objects) {
      object.initialize();
    }
    super.initialize();
  }

  public override update(ellapsed: number): void {
    Camera.mainCamera?.update(ellapsed);
    if (!this.isRunning) return;
    this.ellapsedTime += ellapsed
    super.update(ellapsed);

    for (const object of this.objects.filter(e => e.active)) {
      object.update(ellapsed);
    }
  }

  public override draw(): void {

    if (!this.gl || !Camera.mainCamera) return;

    this.gl.clearColor(this.color[0], Math.sin(this.ellapsedTime) * this.color[1], this.color[2], 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    for (const object of this.objects.filter(e => e.active && e.show)) {
      object.draw();
    }
    super.draw();
  }

  public addEntity(entity: GlEntity) {

    entity.scene = this;
    this._objects.push(entity);
    entity.initialize()
  }

  public setGlRenderingContext(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.behaviours.forEach(b => {
      if (b instanceof RenderMeshBehaviour) {
        const beh = b as RenderMeshBehaviour;
        beh.gl = gl;
      }
    })
  }


  public override destroy(): void {
    for (const child of this.lights) {
      child.destroy();
    }
    for (const child of this.objects) {
      child.destroy();
    }
    this._objects = [];
    super.destroy();
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    for (const light of jsonObject['lights']) {
      this.addEntity(light);
    }
    for (const entity of jsonObject['objects']) {
      this.addEntity(entity);
    }
  }

  public override toJsonObject(): JsonSerializedData {
    const meshMaps: { [key: string]: any } = {}
    const renderers = this.objects.filter(e => e.getBehaviour(RenderMeshBehaviour)).map(o => o.getBehaviour(RenderMeshBehaviour) as RenderMeshBehaviour);
    for (const renderer of renderers) {
      if (renderer.mesh)
        meshMaps[renderer.mesh.meshData.uuid] = renderer.mesh.meshData.toJsonObject();
      else {
        console.debug("No mesh for renderer", renderer)
      }
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

  public getEntitieByName(name: string): GlEntity | undefined {
    return this.objects.find(o => o.name == name);
  }

  public getEntitieByUuid(uuid: string): GlEntity | undefined {
    return this.objects.find(o => o.uuid == uuid);
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

  clear() {
    this._objects = [];
  }

}
