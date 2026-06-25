import { RenderPipeline } from "@engine/core/render/render-pipeline";
import { vec3 } from "gl-matrix";
import { RendererBehaviour } from "../behaviours/renderer/renderer-behaviour";
import { Color, Colors, ObjectInstanciator, SceneFog } from "../core";
import { EntityType } from "../enums/entity-type.enum";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { SceneEntityBehaviour } from "../interfaces/scene-behaviour.interface";
import { CubemapTexture, Texture } from "../textures";
import { Camera } from "./camera";
import { GlEntity } from "./entity";
import { Light } from "./lights/light";
/**
  Represents a scene in the 3D world, acting as a container for entities and managing the main game loop operations like update and draw.
 * @augments {GlEntity}
 */
export class Scene extends GlEntity {

  protected override _className = "Scene";

  public get shadowmap() { return this._renderPipeline.shadowMap; }
  public get renderPipeline(){return this._renderPipeline;}
  
  public sceneFog: SceneFog;
  
  protected _renderPipeline:RenderPipeline;


  /**
    A flag indicating whether the scene's update loop is running.
   * @type {boolean}
   */
  public isRunning: boolean = false;
  /**
   A flag indicating whether the scene is in edit mode (inside editor).
  * @type {boolean}
  */
  public inEditMode: boolean = false;
  /**
    The background color of the scene, in RGB format.
   * @type {vec3}
   */
  public clearColor: Color = Colors.aliceBlue;
  /**
    The tag for the scene entity.
   * @override
   * @type {string}
   */
  public override tag: string = "Scene";
  /**
    A collection of behaviours specific to the scene.
   * @type {SceneEntityBehaviour[]}
   */
  public override behaviours: SceneEntityBehaviour[];
  /**
    The type of the entity, specifically set to SCENE.
   * @override
   * @type {number}
   */
  override entityType: number = EntityType.SCENE;
  /**
    An array of all entities within the scene.
   * @protected
   * @type {GlEntity[]}
   */
  protected _objects: GlEntity[];
  /**
    The WebGL2 rendering context.
   * @protected
   * @type {WebGL2RenderingContext}
   */
  protected gl!: WebGL2RenderingContext;
  /**
    The total elapsed time since the scene started.
   * @protected
   * @type {number}
   */
  protected ellapsedTime: number = 0;
  /**
    Gets the list of all entities in the scene.
   * @readonly
   * @type {GlEntity[]}
   */
  public get objects(): GlEntity[] {
    return this._objects;
  }
  /**
    Gets all light entities in the scene.
   * @readonly
   * @type {Light[]}
   */
  public get lights(): Light[] {
    return this._objects.filter(o => o instanceof Light) as Light[];
  }


  /**
    Creates an instance of Scene.
   */
  constructor() {
    super("Scene");
    this._objects = [];
    this.behaviours = [];
    this.sceneFog = new SceneFog();
    this._renderPipeline = new RenderPipeline();
    this._renderPipeline.initialize(this);

  }

  /**
    Initializes all entities within the scene.
   * @override
   * @returns {void}
   */
  public override initialize(): void {
    for (const object of this.objects) {
      object.initialize();
    }
    super.initialize();
  }

  /**
    Updates the state of the scene and all its active entities.
   * @override
   * @param {number} ellapsed - The elapsed time in seconds since the last update.
   * @returns {void}
   */
  public override update(ellapsed: number): void {
    if (this.destroyed) return;
    Camera.mainCamera.update(ellapsed);
    this.behaviours.forEach(behaviour => behaviour.beforeUpdate(ellapsed));

    if (!this.isRunning && this.inEditMode && this.objects?.length) {
      const toUpdate = this.objects.filter(ob => ob.updateInEditor);
      toUpdate.forEach(entity => entity.update(ellapsed));
      this.behaviours.forEach(behaviour => behaviour.update(ellapsed));
    }

    if (!this.isRunning) return;

    this.ellapsedTime += ellapsed;
    super.update(ellapsed);
    for (const object of this.objects.filter(e => e.active)) {
      object.update(ellapsed);
    }
    this.behaviours.forEach(behaviour => behaviour.afterUpdate());
  }


  /**
    Draws the scene, including clearing the buffer and rendering all visible entities.
   * @override
   * @returns {void}
   */
  public override draw(): void {
    if (this.destroyed || !this.gl || !Camera.mainCamera) return;
    
    this._renderPipeline.draw();
  }


  /**
    Adds a new entity to the scene.
   * @param {GlEntity} entity - The entity to add.
   * @returns {void}
   */
  public addEntity(entity: GlEntity): void {
    if (this.destroyed) return;
    entity.scene = this;
    this._objects.push(entity);
    entity.initialize();
  }

  /**
    Removes an entity from the scene.
   * @param {GlEntity} entity - The entity to remove.
   * @returns {void}
   */
  public removeEntity(entity: GlEntity): void {
    if (this.destroyed) return;
    const index = this._objects.indexOf(entity);
    if (index !== -1) {
      this._objects.splice(index, 1);
      entity.destroy();
    }
  }

  /**
    Adds a new scene-specific behaviour.
   * @override
   * @param {SceneEntityBehaviour} behaviour - The behaviour to add.
   * @returns {void}
   */
  override addBehaviour(behaviour: SceneEntityBehaviour): void {
    behaviour.parent = this;
    this.behaviours.push(behaviour);
    behaviour.initialize();
  }

  /**
    Sets the WebGL2 rendering context for the scene and its rendering behaviours.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {void}
   */
  public setGlRenderingContext(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.behaviours.forEach(behaviour => {
      if (behaviour['setGl'])
        behaviour["setGl"](gl);
    });
    this._renderPipeline.setGlRenderingContext(gl);
  }


  /**
    Destroys the scene and all entities and behaviours within it.
   * @override
   * @returns {void}
   */
  public override destroy(): void {

    for (const child of this.objects) {
      child.destroy();
    }
    this._objects = [];
    super.destroy();
  }

  /**
    Deserializes the scene's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    
    if(jsonObject['renderPipeline']){
      const renderpipeline = ObjectInstanciator.instanciateObjectFromJsonData<RenderPipeline>(jsonObject['renderPipeline'].className)
      this._renderPipeline = renderpipeline || new RenderPipeline();
    }else{
      this._renderPipeline = new RenderPipeline();
    }
    this._renderPipeline.initialize(this);
    
    this.sceneFog.fromJson(jsonObject);
    for (const entity of jsonObject['objects']) {
      this.addEntity(entity);
    }
  }

  /**
    Serializes the scene's state, including all entities and their mesh data, to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    const meshMaps: { [key: string]: any } = {};
    const textureMaps: { [key: string]: any } = {};

    const renderers = this.objects.filter(e => e.getBehaviours(RendererBehaviour)).map(o => o.getBehaviour(RendererBehaviour) as RendererBehaviour);

    for (const renderer of renderers) {
      if (!renderer) continue;

      if (renderer.shader?.material) {
        for (const key of Object.keys(renderer.shader.material)) {
          const property = (renderer.shader.material as any)[key];
          if  (property instanceof CubemapTexture){
            textureMaps[property.textureUris?.join("|") || property.name] = property.toJsonObject();
          } else if (property instanceof Texture) {
            textureMaps[property.textureUri || property.name] = property.toJsonObject();
          }
        }
      }

      if (renderer.mesh) {
        meshMaps[renderer.mesh.meshData.uuid] = renderer.mesh.meshData.toJsonObject();
      } else {
        console.debug("No mesh for renderer", renderer);
      }
    }
    return {
      ...this.getBaseJsonInfo(),
      renderPipeline:this._renderPipeline.toJsonObject(),
      sceneFog:this.sceneFog.toJsonObject(),
      objects: this.objects.map(o => o.toJsonObject()),
      meshMaps,
      textureMaps
    };
  }


  /**
    Retrieves an entity by its name.
   * @param {string} name - The name of the entity to find.
   * @returns {GlEntity | undefined} - The found entity, or undefined.
   */
  public getEntitieByName(name: string): GlEntity | undefined {
    return this.objects.find(o => o.name === name);
  }
  
  /**
    Retrieves an entity by Classname.
   * @param {string} name - The name of the entity class to find.
   * @returns {GlEntity | undefined} - The found entity, or undefined.
   */
  public getEntitieClassByName(className: string): GlEntity | undefined {
    return this.objects.find(o => o.className === className);
  }

  /**
    Retrieves all entity by its Classname.
   * @param {string} className - The name of the entity class to find.
   * @returns {GlEntity[]} - The found entity, or undefined.
   */
  public getEntitiesClassByName(className: string): GlEntity[] {
    return this.objects.filter(o => o.className === className);
  }

  /**
    Retrieves an entity by its unique identifier.
   * @param {string} uuid - The UUID of the entity to find.
   * @returns {GlEntity | undefined} - The found entity, or undefined.
   */
  public getEntitieByUuid(uuid: string): GlEntity | undefined {
    return this.objects.find(o => o.uuid === uuid);
  }

  /**
    Retrieves all entities with a specific tag.
   * @param {string} tag - The tag to filter by.
   * @returns {GlEntity[]} - An array of entities with the given tag.
   */
  public getEntitiesByTag(tag: string): GlEntity[] {
    return this.objects.filter(o => o.tag === tag);
  }

  /**
    Retrieves entities of a specific type from the collection.
   * @template T
   * @param {new (...args: any[]) => T} constructor - The constructor function of the type to filter by.
   * @returns {T[]} - An array of entities of the specified type.
   */
  public getEntities<T extends GlEntity>(constructor: new (...args: any[]) => T): T[] {
    return this._objects.filter((o): o is T => o instanceof constructor);
  }
}
