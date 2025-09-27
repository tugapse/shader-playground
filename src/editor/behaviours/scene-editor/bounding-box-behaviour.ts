
import { mat4, vec3 } from "gl-matrix";
import {
  BoundingBox, Camera, Color,
  ColorMaterial, Colors, DephFunction, GlEntity, Mesh, MeshData,
  RendererBehaviour,
  Shader, ShaderUniformsEnum,
  Transform, Vector3
} from "omega-game-engine";


export class EditorBoundingBoxBehaviour extends RendererBehaviour {

  public selectedBoundingBoxColor: Color = Colors.gray;
  public selectedBoundingBoxLineWidth = 3.0;
  public selectedBoundingBox!: BoundingBox | null;
  private selectedEntity!: GlEntity;


  public hoveredBoundingBoxColor: Color = Colors.grey;
  public hoveredBoundingBoxLineWidth = 1.0;
  public hoveredBoundingBox!: BoundingBox | null;
  private hoveredEntity!: GlEntity;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    const material = new ColorMaterial();
    this.shader = new Shader(this._gl, material);
    this.shader.initialize();
    this.dephMode = DephFunction.LessOrEqual;
    this.createMesh();
  }

  protected createMesh() {
    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData([]);
  }

  protected createGridVertices() {
    const vertices: vec3[] = [];
    return vertices;
  }

  public setTargetEntity(entity: GlEntity | null) {
    if (entity == null) {
      this.selectedBoundingBox = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);
    if (!renderer) {
      console.debug("no renderer found!", entity.name);
      return;
    }
    const box = renderer.mesh.meshData.getBoundingBox(renderer.mesh.meshData.vertices);
    this.selectedBoundingBox = box;
    this.selectedEntity = entity;
  }

  public setHoveredEntity(entity: GlEntity | null) {
    if (entity == null) {
      this.hoveredBoundingBox = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);
    if (!renderer) {
      console.debug("no renderer found!", entity.name);
      return;
    }
    const box = renderer.mesh.meshData.getBoundingBox(renderer.mesh.meshData.vertices);
    this.hoveredBoundingBox = box;
    this.hoveredEntity = entity;
  }

  public override draw(): void {
    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    this.shader.use();
    this.setShaderVariables();

    if (this.selectedBoundingBox && this.selectedEntity) {
      this._gl.lineWidth(this.selectedBoundingBoxLineWidth)
      this.shader.material.color.set(...this.selectedBoundingBoxColor.toVec4())
      this.shader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, this.selectedEntity.transform.modelMatrix);
      this.setMatrices(this.selectedEntity.transform);
      this.drawBoundingBox(this.selectedBoundingBox);
    }

    if (this.selectedEntity) {
      const frw = vec3.scaleAndAdd(vec3.create(), this.selectedEntity.transform.position, this.selectedEntity.transform.forward, 2);
      this.shader.material.color.set(1, 0, 0);
      this.drawPoint(new Vector3(...this.selectedEntity.transform.position));
      this.shader.material.color.set(0, 0, 1);
      this.drawPoint(new Vector3(...frw));
      this.drawLine(new Vector3(...this.selectedEntity.transform.position), new Vector3(...frw))
    }

    if (this.hoveredBoundingBox && this.hoveredEntity) {
      this._gl.lineWidth(this.hoveredBoundingBoxLineWidth)
      this.shader.material.color.set(...this.hoveredBoundingBoxColor.toVec4())
      this.shader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, this.hoveredEntity.transform.modelMatrix);
      this.setMatrices(this.hoveredEntity.transform);
      this.drawBoundingBox(this.hoveredBoundingBox);
    }
    this._gl.lineWidth(1)
  }

  protected override setCameraMatrices(): void { }

  setMatrices(transform: Transform) {
    if (this.shader) {
      const camera = Camera.mainCamera;
      const mvpMatrix = mat4.create();
      mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
      mat4.multiply(mvpMatrix, mvpMatrix, transform.modelMatrix);
      this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
    }
  }

  drawBoundingBox(boundingBox: BoundingBox, spacing = 0.1) {

    const { min_x, min_y, min_z, max_x, max_y, max_z } = boundingBox;

    // looking from front
    // top left far left quad
    const topLeftFar = new Vector3(min_x - spacing, max_y + spacing, min_z - spacing);
    const topLeftNear = new Vector3(min_x - spacing, max_y + spacing, max_z + spacing);
    const bottomLeftFar = new Vector3(min_x - spacing, min_y - spacing, min_z - spacing);
    const bottomLeftNear = new Vector3(min_x - spacing, min_y - spacing, max_z + spacing);

    this.drawLine(topLeftFar, topLeftNear);
    this.drawLine(bottomLeftFar, bottomLeftNear);
    this.drawLine(topLeftFar, bottomLeftFar);
    this.drawLine(topLeftNear, bottomLeftNear);

    // top right far right quad
    const topRightFar = new Vector3(max_x + spacing, max_y + spacing, min_z - spacing);
    const topRightNear = new Vector3(max_x + spacing, max_y + spacing, max_z + spacing);
    const bottomRightFar = new Vector3(max_x + spacing, min_y - spacing, min_z - spacing);
    const bottomRightNear = new Vector3(max_x, min_y - spacing, max_z + spacing);

    this.drawLine(topRightFar, topRightNear);
    this.drawLine(bottomRightFar, bottomRightNear);
    this.drawLine(topRightFar, bottomRightFar);
    this.drawLine(topRightNear, bottomRightNear);

    // horizontal lines
    this.drawLine(topLeftFar, topRightFar);
    this.drawLine(topLeftNear, topRightNear);
    this.drawLine(bottomLeftFar, bottomRightFar);
    this.drawLine(bottomLeftNear, bottomRightNear);

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
