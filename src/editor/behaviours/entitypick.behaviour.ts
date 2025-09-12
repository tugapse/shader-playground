import { mat4 } from "gl-matrix";
import { RendererBehaviour, SceneEntityBehaviour, Texture, CanvasViewport, Scene, Shader, ColorMaterial, MeshData, UnlitMaterial, GlEntity, Camera, ShaderUniformsEnum, Mouse } from "omega-game-engine";
import { EditorBoundingBoxBehaviour } from "./editor-boudingbox.behaviour";
import { SceneTreeService } from "@editor/services/scene-tree.service";

export class EntityPicker extends RendererBehaviour implements SceneEntityBehaviour {

  renderTexture: Texture;
  entityTexture?: Texture;
  selectedEntityId = -1;
  material?: UnlitMaterial;
  width = 0;
  height = 0;
  boundingBehaviour!: EditorBoundingBoxBehaviour;
  mousePressed = false;
  lastClickedId = 0;



  constructor(gl: WebGL2RenderingContext, private sceneTreeService: SceneTreeService) {
    super(gl);
    this.renderTexture = Texture.create(gl, 1024, 1024, null);
    this.shader = new Shader(gl, new ColorMaterial());
    this.mesh.meshData = new MeshData([]);
  }

  beforeUpdate(ellapsed: number): void {
  }
  afterUpdate(): void {

  }
  beforeDraw(): void {

  }
  afterDraw(): void { }

  override update(ellapsed: number): void {


  }


  override draw(): void {

    this.renderAndGetSelected();
    if (Mouse.mouseButtonDown[0] && this.sceneTreeService && this.selectedEntityId != this.lastClickedId) {
      this.lastClickedId = this.selectedEntityId;
      this.sceneTreeService.onEntitySelected.emit((this.parent as Scene).objects[this.selectedEntityId - 1]);
    }
  }

  public renderAndGetSelected() {

    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    if (this.width != CanvasViewport.rendererWidth || this.height != CanvasViewport.rendererHeight) {
      if (this.renderLayer) this.renderTexture.destroy();
      this.width = CanvasViewport.rendererWidth;
      this.height = CanvasViewport.rendererHeight;

      this.renderTexture = Texture.create(this._gl, this.width, this.height);
    }
    this.setRenderTarget(this.renderTexture.glTexture!, this.width, this.height);

    const obs = (this.parent as Scene).objects;
    let count = 0.0;
    for (const ob of obs) {
      count += 1.0;
      const renderer = ob.getBehaviour(RendererBehaviour);
      if (renderer?.shader?._shaderProgram) {
        renderer.shader.use();
        renderer.shader.setFloat('u_id', count);
        renderer.shader.setFloat('u_sid', this.selectedEntityId);
        ob.draw();
        renderer.shader.setFloat('u_id', 0);
      }
    }

    const pixel = new Uint8Array(4);
    this._gl.readPixels(Mouse.mousePosition.x, this.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixel);

    let entity;

    if (pixel[0] != this.selectedEntityId) {
      this.selectedEntityId = pixel[0];
      entity = obs[this.selectedEntityId - 1];
      if (this.boundingBehaviour)
        this.boundingBehaviour.setHoveredEntity(entity);
    }


    // this.renderTexture.unBind();
    this.clearRenderTarget();
  }

}
