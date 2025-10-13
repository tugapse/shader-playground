import { SceneTreeService } from "@editor/services/scene-tree.service";
import { Camera, CanvasViewport, ColorMaterial, Keybord, MeshData, Mouse, RendererBehaviour, Scene, Shader, ShaderUniformsEnum, Texture, Transform, UnlitMaterial } from "@engine";
import { GizmosBoxBehaviour } from "./gizmos-behaviour";
import { mat4 } from "gl-matrix";


export class EntityPicker extends RendererBehaviour {

  renderTexture: Texture;
  selectedEntityId = -1;
  width = 0;
  height = 0;
  boundingBehaviour!: GizmosBoxBehaviour;
  mousePressed = false;
  lastClickedId = 0;
  dontNeedControlToSelect = true;



  constructor(gl: WebGL2RenderingContext, private sceneTreeService: SceneTreeService) {
    super(gl);
    this.renderTexture = Texture.create(gl, 1024, 1024, null);
    // (window as any)['testTexture'] = this.renderTexture;
    this.shader = new Shader(gl, new ColorMaterial(),
      "assets/shaders/frag/entity-picker.frag");
    this.shader.initialize();
    this.mesh.meshData = new MeshData([]);
  }


  override draw(): void {

    // If the gizmo has claimed the mouse, don't perform entity picking.
    if (this.boundingBehaviour?.mouseClaimed) return;

    this.renderAndGetSelected();
    if (this.canSelectEntity()) {
      this.lastClickedId = this.selectedEntityId;
      this.sceneTreeService.onEntitySelected.emit((this.parent as Scene).objects[this.selectedEntityId - 1]);
    }
  }

  private canSelectEntity() {

    return (
      (this.dontNeedControlToSelect || Keybord.keyDown['control']) &&
      Mouse.mouseButtonDown[0] &&
      this.sceneTreeService &&
      this.selectedEntityId != this.lastClickedId
    );
  }

  public renderAndGetSelected() {

    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    this.refreshTexture();
    this.startPass(this.renderTexture.glTexture!, this.width, this.height);

    const obs = (this.parent as Scene).objects;

    let count = 0;
    this.shader.use();
    for (const ob of obs) {
      count += 1;
      const renderer = ob.getBehaviour(RendererBehaviour);
      if (renderer?.shader?._shaderProgram) {
        renderer.shader.bindBuffers();
        this.shader.setFloat('u_entity_id', count);
        this.setMatrices(ob.transform);
        this._gl.drawElements(WebGL2RenderingContext.TRIANGLES, renderer.mesh.meshData.indices.length, this._gl.UNSIGNED_SHORT, 0);
      }
    }
    this.shader.setFloat('u_entity_id', 0);

    const pixel = new Uint8Array(4);
    this._gl.readPixels(Mouse.mousePosition.x, this.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixel);

    let entity;

    if (pixel[0] != this.selectedEntityId) {
      this.selectedEntityId = pixel[0];
      entity = obs[this.selectedEntityId - 1];
      if (this.boundingBehaviour)
        this.boundingBehaviour.setHoveredEntity(entity);
    }
    this.endPass();
  }


  private refreshTexture() {
    if (this.width != CanvasViewport.rendererWidth || this.height != CanvasViewport.rendererHeight) {
      if (this.renderTexture) this.renderTexture.destroy();
      this.width = CanvasViewport.rendererWidth;
      this.height = CanvasViewport.rendererHeight;

      this.renderTexture = Texture.create(this._gl, this.width, this.height);
    }
  }

  setMatrices(transform: Transform) {
    if (this.shader) {
      const camera = Camera.mainCamera;
      const mvpMatrix = mat4.create();
      mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
      mat4.multiply(mvpMatrix, mvpMatrix, transform.modelMatrix);
      this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
    }
  }

}
