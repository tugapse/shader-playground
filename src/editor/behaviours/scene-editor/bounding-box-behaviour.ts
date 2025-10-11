
import { mat4, vec3 } from "gl-matrix";
import {
  BoundingBox, Camera, CanvasViewport, Color,
  ColorMaterial, Colors, DephFunction, GlEntity, Mesh, MeshData,
  Mouse,
  RendererBehaviour,
  Shader, ShaderUniformsEnum,
  Texture, Transform, Vector3
} from "@engine";
import { Raycast } from "./raycast";
import { ConeHelper } from "./cone.helper";


export class EditorBoundingBoxBehaviour extends RendererBehaviour {

  public selectedBoundingBoxColor: Color = Colors.gray;
  public selectedBoundingBoxLineWidth = 3.0;
  public selectedBoundingBox!: BoundingBox | null;
  private selectedEntity!: GlEntity;

  // --- Gizmo State ---
  private activeHandle: 'x' | 'y' | 'z' | null = null;
  private hoveredHandle: 'x' | 'y' | 'z' | null = null;
  private dragStartPoint = vec3.create();
  private dragStartEntityPosition = vec3.create();
  private gizmoSize = 1.0; // Visual size of the gizmo
  private gizmoScale = 1.5; // Scale factor for the cone handles to make them wider
  private handlePointSize = 30.0; // "Fatness" of handles for picking and visuals
  private coneHelper: ConeHelper;

  // --- GPU Picking for Gizmo ---
  private pickingTexture: Texture;
  private pickingShader: Shader;
  private readonly HANDLE_ID_X = 1;
  private readonly HANDLE_ID_Y = 2;
  private readonly HANDLE_ID_Z = 3;

  /** A flag to signal to other behaviours (like EntityPicker) that this behaviour has handled the mouse event. */
  public mouseClaimed = false;
  // -----------------------------


  public hoveredBoundingBoxColor: Color = Colors.grey;
  public hoveredBoundingBoxLineWidth = 1.0;
  public hoveredBoundingBox!: BoundingBox | null;
  private hoveredEntity!: GlEntity;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    const material = new ColorMaterial();
    // Shader for visual rendering of bounding boxes and gizmo
    this.shader = new Shader(this._gl, material);
    this.shader.initialize();

    // Shader for GPU picking of gizmo handles
    this.pickingShader = new Shader(this._gl, new ColorMaterial(), "assets/shaders/frag/entity-picker.frag");
    this.pickingShader.initialize();

    // Off-screen texture for picking
    this.pickingTexture = Texture.create(gl, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight, null);

    this.coneHelper = new ConeHelper(gl, this.shader, this.pickingShader);
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

    // Handle all gizmo logic: picking, dragging, and visual state updates.
    this.handleGizmoInteraction();

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
      this.drawGizmo();
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

  private drawGizmo() {
    if(!this.shader?._shaderProgram) return;
    this._gl.lineWidth(3);
    this.enableDephTest = false; // Draw gizmo on top of everything

    const origin = new Vector3();
    // The gizmo should only be at the entity's position, not rotated or scaled by it.
    const gizmoTransform = mat4.fromTranslation(mat4.create(), this.selectedEntity.transform.worldPosition);

    // X-Axis (Red)
    const xColor = (this.activeHandle === 'x' || this.hoveredHandle === 'x') ? Colors.yellow : Colors.red;
    this.shader.material.color.set(...xColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const xEndVec = vec3.fromValues(this.gizmoSize, 0, 0);
    const xEnd = new Vector3(...xEndVec);
    this.drawLine(origin, xEnd);
    this.drawPoint(xEnd, this.handlePointSize, this.shader);
    // const xConeMatrix = mat4.clone(gizmoTransform);
    // mat4.translate(xConeMatrix, xConeMatrix, xEndVec);
    // mat4.rotateZ(xConeMatrix, xConeMatrix, -Math.PI / 2); // Rotate cone to point along X
    // mat4.scale(xConeMatrix, xConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    // this.setMatrices(this.selectedEntity.transform, xConeMatrix, this.shader);
    // this.coneHelper.draw(xConeMatrix, xColor, this.shader);

    // Y-Axis (Green)
    const yColor = (this.activeHandle === 'y' || this.hoveredHandle === 'y') ? Colors.yellow : Colors.green;
    this.shader.material.color.set(...yColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const yEndVec = vec3.fromValues(0, this.gizmoSize, 0);
    const yEnd = new Vector3(...yEndVec);
    this.drawLine(origin, yEnd);
    this.drawPoint(yEnd, this.handlePointSize, this.shader);
    // const yConeMatrix = mat4.clone(gizmoTransform);
    // mat4.translate(yConeMatrix, yConeMatrix, yEndVec);
    // mat4.scale(yConeMatrix, yConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    // this.setMatrices(this.selectedEntity.transform, yConeMatrix, this.shader);
    // this.coneHelper.draw(yConeMatrix, yColor, this.shader);

    // Z-Axis (Blue)
    const zColor = (this.activeHandle === 'z' || this.hoveredHandle === 'z') ? Colors.yellow : Colors.blue;
    this.shader.material.color.set(...zColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const zEndVec = vec3.fromValues(0, 0, this.gizmoSize);
    const zEnd = new Vector3(...zEndVec);
    this.drawLine(origin, zEnd);
    this.drawPoint(zEnd, this.handlePointSize, this.shader);
    // const zConeMatrix = mat4.clone(gizmoTransform);
    // mat4.translate(zConeMatrix, zConeMatrix, zEndVec);
    // mat4.rotateX(zConeMatrix, zConeMatrix, Math.PI / 2); // Rotate cone to point along Z
    // mat4.scale(zConeMatrix, zConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    // this.setMatrices(this.selectedEntity.transform, zConeMatrix, this.shader);
    // this.coneHelper.draw(zConeMatrix, zColor, this.shader);

    this.enableDephTest = true;
    this._gl.lineWidth(1);
  }

  private handleGizmoInteraction() {
    this.mouseClaimed = !!this.activeHandle;

    if (!this.selectedEntity) {
      this.activeHandle = null;
      this.hoveredHandle = null;
      return;
    }

    // --- 1. Gizmo Picking Render Pass ---
    this.refreshTexture();
    this.startPass(this.pickingTexture.glTexture!, this.pickingTexture.width, this.pickingTexture.height);

    this.pickingShader.use();
    const gizmoTransform = mat4.fromTranslation(mat4.create(), this.selectedEntity.transform.worldPosition);

    // Draw cones for each handle for easy picking
    this._gl.enable(this._gl.DEPTH_TEST);
    this._gl.depthFunc(this.dephMode);

    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.pickingShader);

    // Draw X handle
    this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_X);
    this.drawPoint(new Vector3(this.gizmoSize, 0, 0), this.handlePointSize, this.pickingShader);


    // Draw Y handle
    this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_Y);
    this.drawPoint(new Vector3(0, this.gizmoSize, 0), this.handlePointSize, this.pickingShader);


    // Draw Z handle
    this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_Z);
    this.drawPoint(new Vector3(0, 0, this.gizmoSize), this.handlePointSize, this.pickingShader);

    // --- 2. Read the pixel ---
    const pixel = new Uint8Array(4);
    this._gl.readPixels(Mouse.mousePosition.x, this.pickingTexture.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixel);
    const handleId = pixel[0];

    this.endPass(); // Return to normal drawing

    // --- 3. Update State ---
    if (!this.activeHandle) {
      this.hoveredHandle = null;
      if (handleId === this.HANDLE_ID_X) this.hoveredHandle = 'x';
      if (handleId === this.HANDLE_ID_Y) this.hoveredHandle = 'y';
      if (handleId === this.HANDLE_ID_Z) this.hoveredHandle = 'z';
    }

    // --- 4. Handle Click & Drag ---
    if (Mouse.mouseButtonDown[0] && !this.activeHandle && this.hoveredHandle) {
      // START DRAG
      this.activeHandle = this.hoveredHandle;
      this.mouseClaimed = true;
      vec3.copy(this.dragStartEntityPosition, this.selectedEntity.transform.worldPosition);

      // Project mouse onto a plane to get a 3D starting point for the drag
      const camera = Camera.mainCamera;
      const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });
      const planeNormal = vec3.sub(vec3.create(), camera.transform.worldPosition, this.selectedEntity.transform.worldPosition);
      vec3.normalize(planeNormal, planeNormal);

      const intersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, this.selectedEntity.transform.worldPosition, planeNormal);
      if (intersection) {
        vec3.copy(this.dragStartPoint, intersection);
      }

    } else if (Mouse.mouseButtonDown[0] && this.activeHandle) {
      // DRAGGING
      this.dragEntity();
      this.mouseClaimed = true;

    } else if (!Mouse.mouseButtonDown[0]) {
      // END DRAG
      this.activeHandle = null;
    }
  }

  private dragEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    // Define the axis we are dragging along
    const moveAxis = vec3.create();
    if (this.activeHandle === 'x') vec3.set(moveAxis, 1, 0, 0);
    if (this.activeHandle === 'y') vec3.set(moveAxis, 0, 1, 0);
    if (this.activeHandle === 'z') vec3.set(moveAxis, 0, 0, 1);

    // We cast a ray from the camera to a virtual plane that is facing the camera and contains the drag start point.
    // This gives us a 3D representation of the mouse's movement.
    const planeNormal = camera.transform.forward;
    const intersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, this.dragStartPoint, planeNormal);

    if (intersection) {
      const moveVector = vec3.sub(vec3.create(), intersection, this.dragStartPoint);
      const projectedLength = vec3.dot(moveVector, moveAxis);
      const newPosition = vec3.scaleAndAdd(vec3.create(), this.dragStartEntityPosition, moveAxis, projectedLength);
      this.selectedEntity.transform.setWorldPosition(newPosition[0], newPosition[1], newPosition[2]);
    }
  }

  protected override setCameraMatrices(): void { }

  setMatrices(transform: Transform, modelMatrix?: mat4, shader: Shader = this.shader!) {
    if (shader) {
      shader.use();
      const camera = Camera.mainCamera;
      const matrix = modelMatrix ? modelMatrix : transform.modelMatrix;
      const mvpMatrix = mat4.create();
      mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
      mat4.multiply(mvpMatrix, mvpMatrix, matrix);
      shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
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

  private refreshTexture() {
    if (this.pickingTexture.width !== CanvasViewport.rendererWidth || this.pickingTexture.height !== CanvasViewport.rendererHeight) {
      this.pickingTexture.destroy();
      this.pickingTexture = Texture.create(this._gl, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight, null);
    }
  }

}
