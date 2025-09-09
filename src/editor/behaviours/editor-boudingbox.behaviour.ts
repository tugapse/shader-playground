
import { Camera, Color, ColorMaterial, Colors, DephFunction, GlEntity, Mesh, MeshData, RendererBehaviour, SceneEntityBehaviour, Shader, ShaderUniformsEnum, Transform, Vector3 } from "omega-game-engine";
import { BoundingBox, BoundingSphere } from "../overrides/bounding-box";
import { mat4, vec3 } from "gl-matrix";


export class EditorBoundingBoxBehaviour extends RendererBehaviour implements SceneEntityBehaviour {

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
    const box = this.get_bounding_box(renderer.mesh.meshData.vertices);
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
    const box = this.get_bounding_box(renderer.mesh.meshData.vertices);
    this.hoveredBoundingBox = box;
    this.hoveredEntity = entity;
  }



  override draw(): void {
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
    const topLeftFar = new Vector3(min_x - spacing, max_y + spacing, min_z- spacing);
    const topLeftNear = new Vector3(min_x - spacing, max_y+ spacing, max_z+ spacing);
    const bottomLeftFar = new Vector3(min_x - spacing, min_y - spacing, min_z- spacing);
    const bottomLeftNear = new Vector3(min_x - spacing, min_y - spacing, max_z+ spacing);

    this.drawLine(topLeftFar, topLeftNear);
    this.drawLine(bottomLeftFar, bottomLeftNear);
    this.drawLine(topLeftFar, bottomLeftFar);
    this.drawLine(topLeftNear, bottomLeftNear);

    // top right far right quad
    const topRightFar = new Vector3(max_x+ spacing, max_y+ spacing, min_z- spacing);
    const topRightNear = new Vector3(max_x+ spacing, max_y+ spacing, max_z+ spacing);
    const bottomRightFar = new Vector3(max_x+ spacing, min_y- spacing, min_z- spacing);
    const bottomRightNear = new Vector3(max_x, min_y- spacing, max_z+ spacing);

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

  /**
   * Calculates the bounding box for this mesh using its internal vertices.
   *
   * @returns A BoundingBox object, or null if the mesh has no vertices.
   */
  get_bounding_box(vertices: vec3[]): BoundingBox | null {
    if (vertices.length === 0) {
      return null;
    }

    // Initialize min and max values with the first vertex
    let min_x = vertices[0][0];
    let max_x = vertices[0][0];
    let min_y = vertices[0][1];
    let max_y = vertices[0][1];
    let min_z = vertices[0][2];
    let max_z = vertices[0][2];

    // Iterate through each vertex array
    for (const vertex of vertices) {
      const x = vertex[0];
      const y = vertex[1];
      const z = vertex[2];

      // Update min and max values
      min_x = Math.min(min_x, x);
      max_x = Math.max(max_x, x);
      min_y = Math.min(min_y, y);
      max_y = Math.max(max_y, y);
      min_z = Math.min(min_z, z);
      max_z = Math.max(max_z, z);
    }

    return new BoundingBox(min_x, max_x, min_y, max_y, min_z, max_z);
  }

  /**
   * Calculates a bounding sphere for this mesh using its internal vertices.
   * The sphere's center is the mesh's centroid.
   *
   * @returns A BoundingSphere object, or null if the mesh has no vertices.
   */
  get_bounding_sphere(vertices: vec3[]): BoundingSphere | null {
    if (vertices.length === 0) {
      return null;
    }

    // First, calculate the centroid of the mesh
    let sum_x = 0;
    let sum_y = 0;
    let sum_z = 0;
    for (const vertex of vertices) {
      sum_x += vertex[0];
      sum_y += vertex[1];
      sum_z += vertex[2];
    }
    const numVertices = vertices.length;
    const center_x = sum_x / numVertices;
    const center_y = sum_y / numVertices;
    const center_z = sum_z / numVertices;

    // Then, find the maximum distance from the centroid to any vertex
    let max_radius_squared = 0;
    for (const vertex of vertices) {
      const dx = vertex[0] - center_x;
      const dy = vertex[1] - center_y;
      const dz = vertex[2] - center_z;
      const distance_squared = dx * dx + dy * dy + dz * dz;
      max_radius_squared = Math.max(max_radius_squared, distance_squared);
    }
    const radius = Math.sqrt(max_radius_squared);

    return new BoundingSphere(center_x, center_y, center_z, radius);
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
