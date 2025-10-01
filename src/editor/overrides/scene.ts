import { vec3 } from "gl-matrix";
import { GlEntity, Color, Colors, SceneEntityBehaviour, EntityType, Light, Texture, Camera, RendererBehaviour, RenderLayer, JsonSerializedData, CubemapTexture, Scene } from "omega-game-engine";
import { ShadowMapRenderer } from "./shadowmap-renderer";

/**
  Represents a scene in the 3D world, acting as a container for entities and managing the main game loop operations like update and draw.
 * @augments {GlEntity}
 */
export class EditorScene extends Scene {

  protected _shadowmapRenderer!: ShadowMapRenderer;
  public get shadowmapRenderer() { return this._shadowmapRenderer; }

  constructor() {
    super();
  }

  override setGlRenderingContext(gl: WebGL2RenderingContext): void {
    if (!this._shadowmapRenderer){
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
    if (this.destroyed || !this.gl || !Camera.mainCamera) return;
    // this.shadowmapRenderer.drawShadowMap();

    const activeObjects = this.objects.filter(ob => ob.active && ob.show).sort((a, b) => this.sortByRenderLayer(a, b));
    const opaqueObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.OPAQUE);
    const transparentObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.TRANSPARENT);
    const preObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.PRE_SCENE);
    const postObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.POST_SCENE);
    const skyboxObjects = activeObjects.filter(e => e.getBehaviour(RendererBehaviour)?.renderLayer == RenderLayer.SKYBOX);


    preObjects.sort((a, b) => this.sortByDistance(a, b));
    postObjects.sort((a, b) => this.sortByDistance(a, b));
    opaqueObjects.sort((a, b) => this.sortByDistance(a, b));
    transparentObjects.sort((a, b) => this.sortByDistance(a, b));
    skyboxObjects.sort((a, b) => this.sortByDistance(a, b));


    this.behaviours.filter(behaviour => behaviour.active).forEach(behaviour => behaviour.beforeDraw());

    this.gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);

    for (const object of preObjects) { object.draw(); }
    for (const object of opaqueObjects) { object.draw(); }
    for (const object of transparentObjects) { object.draw(); }
    for (const object of postObjects) { object.draw(); }
    for (const object of skyboxObjects) { object.draw(); }

    super.draw();

    this.behaviours.filter(behaviour => behaviour.active).forEach(behaviour => behaviour.afterDraw());
  }



}
