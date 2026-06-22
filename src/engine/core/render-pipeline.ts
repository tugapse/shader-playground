import { Camera, DirectionalLight, GlEntity, Scene } from '@engine/entities';
import { JsonSerializable } from './json-serializable';
import { JsonSerializedData } from '@engine/interfaces';
import { RendererBehaviour } from '@engine/behaviours/renderer/renderer-behaviour';
import { RenderLayer } from '@engine/enums/render-layer.enum';
import { vec3 } from 'gl-matrix';
import { Colors } from './colors';
import { EntityType } from '@engine/enums';
import { ShadowMapRenderer } from './shadowmap-renderer';
import { ObjectInstanciator } from './object-instanciator';
import { ClassType } from '@engine/enums/class-type.enum';
import { CameraUBO } from './camera-ubo';

export class RenderPipeline extends JsonSerializable {
  static instanciate() {
    return new RenderPipeline();
  }
  protected _gl!: WebGL2RenderingContext;
  protected _ellapsedFrames = 0;
  protected _maxFramesNeededToResort = 20;

  protected _activeObjects: GlEntity[] = [];
  protected _opaqueObjects: GlEntity[] = [];
  protected _transparentObjects: GlEntity[] = [];
  protected _skyboxObjects: GlEntity[] = [];

  public clearColor = Colors.cornflowerBlue;
  public shadowmapRenderer!: ShadowMapRenderer;
  protected scene!: Scene;
  protected ubo!: CameraUBO;

  constructor(public override name: string = 'Render Pipeline') {
    super('RenderPipeline');
  }
  public setGlRenderingContext(gl: WebGL2RenderingContext): void {
    this._gl = gl;
    this.ubo = new CameraUBO(this._gl);

    if (!this.shadowmapRenderer) {
      this.shadowmapRenderer = new ShadowMapRenderer(this._gl, this.scene);
    }
  }

  public initialize(scene: Scene) {
    this.scene = scene;
  }

  public draw() {
    if (!this.scene) {
      console.error('No scene defined for this render pipeline');
      return;
    }
    
    this._ellapsedFrames += 1;
    if (
      this._ellapsedFrames > this._maxFramesNeededToResort ||
      this._activeObjects.length == 0
    ) {
      this.fetchandSortEntities();
      this._ellapsedFrames = 0;
    }

    const camera = Camera.mainCamera;
    this.ubo.update(camera.viewMatrix, camera.projectionMatrix);

    this.drawShadowmap();
    this.drawScene();
    // this.drawPostProcess();
  }
  public drawScene() {
    for (const object of this._opaqueObjects) {
      object.draw();
    }
    for (const object of this._skyboxObjects) {
      object.draw();
    }
    for (const object of this._transparentObjects) {
      object.draw();
    }
  }

  public clearScreen() {
    this._gl.clearColor(
      this.clearColor.r,
      this.clearColor.g,
      this.clearColor.b,
      1.0,
    );
    this._gl.clear(
      this._gl.COLOR_BUFFER_BIT |
        this._gl.DEPTH_BUFFER_BIT |
        this._gl.STENCIL_BUFFER_BIT,
    );
  }

  protected fetchandSortEntities() {
    this._activeObjects = this.scene.objects
      .filter((o) => o.active)
      .sort((a, b) => this.sortByDistance(a, b));
    this._opaqueObjects = this._activeObjects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.OPAQUE,
    );

    this._transparentObjects = this.scene.objects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer ==
        RenderLayer.TRANSPARENT,
    );

    this._skyboxObjects = this.scene.objects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.SKYBOX,
    );
  }

  protected drawShadowmap() {
    if (!this.shadowmapRenderer?.enabled) {
      this.shadowmapRenderer.clearShadowMap();
    }
    const lightEntity = this.scene.lights.find(
      (obj) =>
        obj.entityType === EntityType.LIGHT_DIRECTIONAL &&
        obj.active &&
        obj.show,
    );
    if (this.shadowmapRenderer?.enabled && lightEntity) {
      this.shadowmapRenderer.drawShadowapTexture(
        lightEntity as DirectionalLight,
      );
    } else {
      this.shadowmapRenderer.clearShadowMap();
    }
  }

  protected sortByDistance(a: GlEntity, b: GlEntity) {
    const aD = vec3.distance(
      a.transform.worldPosition,
      Camera.mainCamera.transform.worldPosition,
    );
    const bD = vec3.distance(
      b.transform.worldPosition,
      Camera.mainCamera.transform.worldPosition,
    );
    return bD - aD;
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }
}

ObjectInstanciator.addDependency('RenderPipeline', RenderPipeline.instanciate, {
  name: 'RenderPipeline',
  type: ClassType.RenderBehaviour,
  path: 'Renderers/RenderPipeline',
  description: 'Base class for all rendering Pipelines.',
});
