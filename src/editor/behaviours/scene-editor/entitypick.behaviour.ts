import { SceneTreeService } from "@editor/services/scene-tree.service";
import { Camera, CanvasViewport, ColorMaterial, Keybord, MeshData, Mouse, RendererBehaviour, Scene, Shader, ShaderSources, ShaderUniformsEnum, Texture, Transform } from "@engine";
import { GizmosBoxBehaviour } from "./gizmos-behaviour";

export class EntityPicker extends RendererBehaviour {

  renderTexture: Texture;
  selectedEntityId = -1;
  width = 0;
  height = 0;
  boundingBehaviour!: GizmosBoxBehaviour;
  lastClickedId = -1; 
  dontNeedControlToSelect = true;

  private readonly _pickingPixel = new Uint8Array(4);

  constructor(gl: WebGL2RenderingContext, private sceneTreeService: SceneTreeService) {
    super(gl);
    this.renderTexture = Texture.create(gl, 1024, 1024, null);
    
    this.shader = new Shader(gl, new ColorMaterial(), ShaderSources.frag.entity_picker);
    this.shader.initialize();
    this.mesh.meshData = new MeshData([]);
  }

  override draw(): void {
    if (this.boundingBehaviour?.mouseClaimed) return;

    if (Mouse.mouseButtonDown[0]) {
      this.renderAndGetSelected();

      if (this.canSelectEntity()) {
        this.lastClickedId = this.selectedEntityId;
        
        const selectedEntity = this.selectedEntityId > 0 ? (this.parent as Scene).objects[this.selectedEntityId - 1] : undefined;
        this.sceneTreeService.onEntitySelected.emit(selectedEntity);
      }
    }
  }

  private canSelectEntity(): boolean {
    return (
      (this.dontNeedControlToSelect || Keybord.keyDown['control']) &&
      !!this.sceneTreeService &&
      this.selectedEntityId !== this.lastClickedId
    );
  }

  public renderAndGetSelected(): void {
    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    this.refreshTexture();
    this.startPass(this.renderTexture.glTexture!, this.width, this.height);

    // CRITICAL FIX 1: Clear the off-screen buffer before drawing!
    // If we don't clear depth, WebGL will reject the pixels based on old data.
    this._gl.clearColor(0, 0, 0, 0);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

    const obs = (this.parent as Scene).objects;

    let count = 0;
    this.shader.use();
    
    const posLoc = this._gl.getAttribLocation(this.shader._shaderProgram, ShaderUniformsEnum.A_POSITION);

    for (const ob of obs) {
      count += 1;
      const renderer = ob.getBehaviour(RendererBehaviour);
      
      if (renderer?.shader?._shaderProgram && renderer.shader.buffers.position) {
        
        if (posLoc !== -1) {
          this._gl.bindBuffer(this._gl.ARRAY_BUFFER, renderer.shader.buffers.position);
          this._gl.vertexAttribPointer(posLoc, 3, this._gl.FLOAT, false, 0, 0);
          this._gl.enableVertexAttribArray(posLoc);
        }

        if (renderer.shader.buffers.indices) {
          this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, renderer.shader.buffers.indices);
        }

        this.shader.setFloat('u_entity_id', count);
        this.setMatrices(ob.transform);
        this._gl.drawElements(this._gl.TRIANGLES, renderer.mesh.meshData.indices.length, this._gl.UNSIGNED_SHORT, 0);
        
        if (posLoc !== -1) {
          this._gl.disableVertexAttribArray(posLoc);
        }
      }
    }
    
    this.shader.setFloat('u_entity_id', 0);

    // Read the exact pixel
    this._gl.readPixels(Mouse.mousePosition.x, this.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, this._pickingPixel);

    if (this._pickingPixel[0] !== this.selectedEntityId) {
      this.selectedEntityId = this._pickingPixel[0];
      
      const entity = this.selectedEntityId > 0 ? obs[this.selectedEntityId - 1] : null;
      
      if (this.boundingBehaviour) {
        this.boundingBehaviour.setTargetEntity(entity); 
      }
    }
    
    this.endPass();
  }

  private refreshTexture(): void {
    if (this.width !== CanvasViewport.rendererWidth || this.height !== CanvasViewport.rendererHeight) {
      if (this.renderTexture) this.renderTexture.destroy();
      
      this.width = CanvasViewport.rendererWidth;
      this.height = CanvasViewport.rendererHeight;
      this.renderTexture = Texture.create(this._gl, this.width, this.height);
    }
  }

  setMatrices(transform: Transform): void {
    if (this.shader) {
      // CRITICAL FIX 2: Force it to set u_worldMatrix to match vertex.vert exactly
      this.shader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, transform.modelMatrix);
      this.shader.setMat4('u_worldMatrix', transform.modelMatrix); 
    }
  }
}