
import { vec3 } from "gl-matrix";
import { Color, ColorMaterial, DephFunction, Mesh, MeshData, RendererBehaviour, RenderLayer, SceneEntityBehaviour, Shader, Vector3 } from "@engine";


export class EditorGridBehaviour extends RendererBehaviour {

  public gridColor: Color = new Color(0.31, 0.31, 0.48);
  public gridLineWidt = 1.0;



  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    const material = new ColorMaterial();
    this.shader = new Shader(this._gl, material);
    this.shader.initialize();
    this.dephMode = DephFunction.Less;
    this.renderLayer = RenderLayer.POST_SCENE;
    this.createMesh();
    this._gl.lineWidth(1.0);
    // this.active = false;

  }

  protected createMesh() {
    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData([]);
  }

  protected createGridVertices() {
    const vertices: vec3[] = [];
    return vertices;
  }


  override draw(): void {
    if (!this.shader?._shaderProgram || !this.active) return;
    if (!this._initialized) {
      this.initialize();
    }
    const count = 10;
    this.shader.use();
    this.shader.material.color.set(...this.gridColor.toVec4())
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

}
