
import { Color, ColorMaterial, Colors, DephFunction, GlEntity, Mesh, MeshData, RendererBehaviour, SceneEntityBehaviour, Shader, Vector3 } from "omega-game-engine";
import { BoundingBox } from "../overrides/bounding-box";
import { vec3 } from "gl-matrix";


export class EditorGridBehaviour extends RendererBehaviour implements SceneEntityBehaviour {

  public gridColor: Color = new Color(0.31, 0.31, 0.48);
  private _boundingBox?: BoundingBox;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    const material = new ColorMaterial();
    this.shader = new Shader(this._gl, material);
    this.dephMode = DephFunction.LessOrEqual;
    this.createMesh();
    this._gl.lineWidth(1.0);
  }

  protected createMesh(){
    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData([]);
  }

  protected createGridVertices() {
    const vertices:vec3[] = [];
    return vertices;
  }

  public setTargetEntity(entity: GlEntity | null) {
    if (entity == null) {
      this._boundingBox = undefined;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);
    if (!renderer){
      console.debug("no renderer found!", entity.name);
      return;
    }
  }


  override draw(): void {
    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    this.shader.use();
    this.setShaderVariables();
    this.shader.material.color.set(...this.gridColor.toVec4())
    const count = 10;
    this.drawHorizontalLines(count);
    this.drawVerticalLines(count);
  }

  protected drawVerticalLines(count: number = 10) {
    let fromV = new Vector3();
    let toV = new Vector3();

    for (let x = -count; x <= count; x++) {
      fromV.set(x, 0, -count);
      toV.set(x, 0, count);
      this.drawLine(fromV, toV);
    }
  }

  protected drawHorizontalLines(count: number = 10) {
    let fromH = new Vector3();
    let toH = new Vector3();
    for (let z = -count; z <= count; z++) {
      fromH.set(-count, 0, z);
      toH.set(count, 0, z);
      this.drawLine(fromH, toH);

    }



  }


  beforeUpdate(ellapsed: number): void {
  }
  afterUpdate(): void {
  }
  beforeDraw(): void {
  }
  afterDraw(): void {
  }

}
