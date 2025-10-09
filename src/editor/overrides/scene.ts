import { Camera, Colors, EngineCache, EntityType, GlEntity, JsonSerializedData, RendererBehaviour, RenderLayer, Scene } from "@engine";
import { SceneFog } from "./scene-fog";
import { ShadowMapRenderer } from "./shadowmap-renderer";

/**
  Represents a scene in the 3D world, acting as a container for entities and managing the main game loop operations like update and draw.
 * @augments {GlEntity}
 */
export class EditorScene extends Scene {

  protected _shadowmapRenderer!: ShadowMapRenderer;
  public get shadowmapRenderer() { return this._shadowmapRenderer; }
  public fog: SceneFog;

  constructor() {
    super();
    this.fog = new SceneFog(Colors.cornflowerBlue, 0, 0.002);
  }

  override setGlRenderingContext(gl: WebGL2RenderingContext): void {
    super.setGlRenderingContext(gl);
    if (!this._shadowmapRenderer) {
      this._shadowmapRenderer = new ShadowMapRenderer(this.gl, this);
      this.shadowMap = this._shadowmapRenderer.shadowmapTexture;
    }
  }




  /**
    Draws the scene, including clearing the buffer and rendering all visible entities.
   * @override
   * @returns {void}
   */
  public override draw(): void {
    if (this.destroyed || !this.gl || !Camera.mainCamera || !this.shadowmapRenderer) return;

    const lightEntity = this.lights.find(obj => obj.entityType === EntityType.LIGHT_DIRECTIONAL);
    if (lightEntity) {
      this.shadowmapRenderer.drawShadowapTexture(lightEntity.transform);
    }

    const activeObjects = this.objects.filter(ob => ob.active && ob.show).sort((a, b) => this.sortByRenderLayer(a, b));
    const preObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.PRE_SCENE);
    const opaqueObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.OPAQUE);
    const transparentObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.TRANSPARENT);
    const postObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.POST_SCENE);
    const skyboxObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.SKYBOX);


    preObjects.sort((a, b) => this.sortByDistance(a, b));
    postObjects.sort((a, b) => this.sortByDistance(a, b));
    opaqueObjects.sort((a, b) => this.sortByDistance(a, b));
    transparentObjects.sort((a, b) => this.sortByDistance(a, b));
    skyboxObjects.sort((a, b) => this.sortByDistance(a, b));

    this.gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);

    for (const object of preObjects) { object.draw(); }
    for (const object of opaqueObjects) { object.draw(); }
    for (const object of transparentObjects) { object.draw(); }
    for (const object of postObjects) { object.draw(); }
    for (const object of skyboxObjects) { object.draw(); }


  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    debugger
  }

  override destroy(): void {
    super.destroy();
    this.shadowmapRenderer.destroy();
    EngineCache.clear();
  }

}
