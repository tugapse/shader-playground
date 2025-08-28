import { RendererBehaviour, RenderMeshBehaviour, SceneEntityBehaviour } from "@engine/behaviours";
import { EngineCache, Mesh } from "@engine/core";
import { GlEntity, Scene } from "@engine/entities";
import { GLPrimitiveType } from "@engine/enums";
import { JsonSerializedData } from "@engine/interfaces";
import { ColorMaterial } from "@engine/materials";
import { Shader } from "@engine/shaders";


export class EditorRenderBehaviour extends RenderMeshBehaviour implements SceneEntityBehaviour {


  protected entityhandle!: GlEntity;
  protected handleRenderer!: RendererBehaviour;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    EngineCache.getMeshDataFromObj("assets/primitives/axis.obj").then(loadedMeshData => {
      this.mesh = new Mesh();
      this.mesh.meshData = loadedMeshData;
      this.entityhandle = new GlEntity("Handle");
      const material = new ColorMaterial();
      this.shader = new Shader(this.gl, material);
      this.shader.fragUri = "assets/shaders/editor/handle/handle.frag";
      this.shader.vertexUri = "assets/shaders/editor/handle/handle.vert";
      this.handleRenderer = new RendererBehaviour(this.gl);
      this.entityhandle.addBehaviour(this.handleRenderer);
      this.drawPrimitiveType = GLPrimitiveType.LINE_STRIP;

    });
  }

  override initialize(): boolean {
    return super.initialize();
  }

  protected override initializeShader(): void {
    if (this._initialized) this.initialize();
    this.entityhandle.initialize();
    super.initializeShader();
  }

  beforeUpdate(ellapsed: number): void {
  }

  afterUpdate(): void {
  }

  override update(ellapsed: number): void {
    this.entityhandle.update(ellapsed);
  }

  beforeDraw(): void {

  }

  afterDraw(): void {
    if (this.entityhandle) {
      // this.entityhandle.draw();
      const parent = this.parent as Scene;
      for (const oj of parent.objects) {
        this.entityhandle.transform.translate(...oj.transform.position);
        this.entityhandle.transform.setRotationQuat(oj.transform.rotationQuat);
        this.entityhandle.transform.setScale(...oj.transform.localScale);
        this.entityhandle.transform.setDirty(true);
        this.entityhandle.draw();
      }
    }
  }


  override toJsonObject(): JsonSerializedData {
    return super.toJsonObject();
  }

}
