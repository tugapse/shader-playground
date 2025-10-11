
import { mat4, quat, vec3 } from "gl-matrix";
import {
  BoundingBox, Camera, CanvasViewport, Color,
  ColorMaterial, Colors, DephFunction, GlEntity, Mesh, MeshData,
  Mouse,
  RendererBehaviour,
  Shader, ShaderUniformsEnum,
  Texture, Transform, Vector3
} from "@engine";
import { Raycast } from "./raycast";
import { CubeHelper } from "./cube.helper"; // Assuming this will be created
import { ConeHelper } from "./cone.helper"; // Assuming this will be created
import { CircleHelper } from "./circle.helper";


export class EditorBoundingBoxBehaviour extends RendererBehaviour {

  public selectedBoundingBoxColor: Color = Colors.gray;
  public selectedBoundingBoxLineWidth = 3.0;
  public selectedBoundingBox!: BoundingBox | null;
  private selectedEntity!: GlEntity;

  // --- Gizmo State ---
  private gizmoMode: 'translate' | 'rotate' | 'scale' = 'rotate'; // Default to 'translate'
  private activeHandle: string | null = null;
  private hoveredHandle: string | null = null;
  private isDragging = false;
  private readonly dragThreshold = 5; // pixels

  // Translate state
  private dragStartPoint = vec3.create();
  private dragStartEntityPosition = vec3.create();

  // Scale state
  private dragStartEntityScale = vec3.create();

  // Rotate state
  private dragStartEntityRotation = quat.create();

  private gizmoSize = 1.0; // Visual size of the gizmo
  private gizmoScale = 1.5; // Scale factor for the cone handles to make them wider
  private handlePointSize = 30.0; // "Fatness" of handles for picking and visuals
  private coneHelper!: ConeHelper;
  private cubeHelper: CubeHelper;
  private circleHelper: CircleHelper;

  // --- GPU Picking for Gizmo ---
  private pickingTexture: Texture;
  private pickingShader: Shader;
  private readonly HANDLE_ID_TRANSLATE_X = 1;
  private readonly HANDLE_ID_TRANSLATE_Y = 2;
  private readonly HANDLE_ID_TRANSLATE_Z = 3;
  private readonly HANDLE_ID_SCALE_X = 4;
  private readonly HANDLE_ID_SCALE_Y = 5;
  private readonly HANDLE_ID_SCALE_Z = 6;
  private readonly HANDLE_ID_ROTATE_X = 7;
  private readonly HANDLE_ID_ROTATE_Y = 8;
  private readonly HANDLE_ID_ROTATE_Z = 9;


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
    this.shader!.initialize();

    // Shader for GPU picking of gizmo handles
    this.pickingShader = new Shader(this._gl, new ColorMaterial(), "assets/shaders/frag/entity-picker.frag");
    this.pickingShader.initialize();

    // Off-screen texture for picking
    this.pickingTexture = Texture.create(gl, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight, null);

    this.coneHelper = new ConeHelper(gl, this.shader, this.pickingShader);
    this.cubeHelper = new CubeHelper(gl, this.shader, this.pickingShader);
    this.circleHelper = new CircleHelper(gl);
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

    this.shader!.use();
    this.setShaderVariables();

    if (this.selectedBoundingBox && this.selectedEntity) {
      this._gl.lineWidth(this.selectedBoundingBoxLineWidth)
      this.shader!.material.color.set(...this.selectedBoundingBoxColor.toVec4())
      this.shader!.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, this.selectedEntity.transform.modelMatrix);
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

    const origin = new Vector3();
    // The gizmo should only be at the entity's position, not rotated or scaled by it.
    const gizmoTransform = mat4.fromTranslation(mat4.create(), this.selectedEntity.transform.worldPosition);

    this._gl.disable(WebGL2RenderingContext.DEPTH_TEST);
    switch (this.gizmoMode) {
      case 'translate':
        this.drawTranslateGizmo(gizmoTransform);
        break;
      case 'scale':
        this.drawScaleGizmo(gizmoTransform);
        break;
      case 'rotate':
        this.drawRotateGizmo(gizmoTransform);
        break;
      default:
        this.drawTranslateGizmo(gizmoTransform);
        break;
    }

    this._gl.lineWidth(1);
  }

  private drawTranslateGizmo(gizmoTransform: mat4) {
    const origin = new Vector3();
    // X-Axis (Red)
    const xColor = (this.activeHandle === 'x' || this.hoveredHandle === 'x') ? Colors.yellow : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
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
    this.shader!.material.color.set(...yColor.toVec4());
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
    this.shader!.material.color.set(...zColor.toVec4());
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
  }

  private drawScaleGizmo(gizmoTransform: mat4) {
    const origin = new Vector3();
    // X-Axis (Red)
    const xColor = (this.activeHandle === 'scaleX' || this.hoveredHandle === 'scaleX') ? Colors.yellow : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const xEndVec = vec3.fromValues(this.gizmoSize, 0, 0);
    const xEnd = new Vector3(...xEndVec);
    this.drawLine(origin, xEnd);
    this.drawPoint(xEnd, this.handlePointSize, this.shader);

    // Y-Axis (Green)
    const yColor = (this.activeHandle === 'scaleY' || this.hoveredHandle === 'scaleY') ? Colors.yellow : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader!);
    const yEndVec = vec3.fromValues(0, this.gizmoSize, 0);
    const yEnd = new Vector3(...yEndVec);
    this.drawLine(origin, yEnd);
    this.drawPoint(yEnd, this.handlePointSize, this.shader);

    // Z-Axis (Blue)
    const zColor = (this.activeHandle === 'scaleZ' || this.hoveredHandle === 'scaleZ') ? Colors.yellow : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader!);
    const zEndVec = vec3.fromValues(0, 0, this.gizmoSize);
    const zEnd = new Vector3(...zEndVec);
    this.drawLine(origin, zEnd);
    this.drawPoint(zEnd, this.handlePointSize, this.shader);
  }

 private drawRotateGizmo(gizmoTransform: mat4) {
    const gizmoSize = this.gizmoSize * 1.2; // Make rings a bit larger

    // X-Axis Ring (Red) - Rotated around Y-axis to be on the YZ plane
    const xColor = (this.activeHandle === 'rotateX' || this.hoveredHandle === 'rotateX') ? Colors.yellow : Colors.red;
    const xRingMatrix = mat4.clone(gizmoTransform);
    mat4.rotateY(xRingMatrix, xRingMatrix, Math.PI / 2);
    mat4.scale(xRingMatrix, xRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, xRingMatrix, this.shader!);
    (this.shader!.material as ColorMaterial).color = xColor;
    this.circleHelper.draw(this.shader!);

    // Y-Axis Ring (Green) - Rotated around X-axis to be on the XZ plane
    const yColor = (this.activeHandle === 'rotateY' || this.hoveredHandle === 'rotateY') ? Colors.yellow : Colors.green;
    const yRingMatrix = mat4.clone(gizmoTransform);
    mat4.rotateX(yRingMatrix, yRingMatrix, Math.PI / 2);
    mat4.scale(yRingMatrix, yRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, yRingMatrix, this.shader!);
    (this.shader!.material as ColorMaterial).color = yColor;
    this.circleHelper.draw(this.shader!);

    // Z-Axis Ring (Blue) - No rotation needed, it's on the XY plane by default
    const zColor = (this.activeHandle === 'rotateZ' || this.hoveredHandle === 'rotateZ') ? Colors.yellow : Colors.blue;
    const zRingMatrix = mat4.clone(gizmoTransform);
    mat4.scale(zRingMatrix, zRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, zRingMatrix, this.shader!);
    (this.shader!.material as ColorMaterial).color = zColor;
    this.circleHelper.draw(this.shader!);
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

    this._gl.enable(this._gl.DEPTH_TEST);
    this._gl.depthFunc(this.dephMode);

    const handleId = this.drawPickingGizmo(gizmoTransform);

    this.endPass(); // Return to normal drawing

    // --- 3. Update State ---
    if (!this.activeHandle) {
      this.hoveredHandle = null;
      switch (handleId) {
        case this.HANDLE_ID_TRANSLATE_X: this.hoveredHandle = 'translateX'; break;
        case this.HANDLE_ID_TRANSLATE_Y: this.hoveredHandle = 'translateY'; break;
        case this.HANDLE_ID_TRANSLATE_Z: this.hoveredHandle = 'translateZ'; break;
        case this.HANDLE_ID_SCALE_X: this.hoveredHandle = 'scaleX'; break;
        case this.HANDLE_ID_SCALE_Y: this.hoveredHandle = 'scaleY'; break;
        case this.HANDLE_ID_SCALE_Z: this.hoveredHandle = 'scaleZ'; break;
        case this.HANDLE_ID_ROTATE_X: this.hoveredHandle = 'rotateX'; break;
        case this.HANDLE_ID_ROTATE_Y: this.hoveredHandle = 'rotateY'; break;
        case this.HANDLE_ID_ROTATE_Z: this.hoveredHandle = 'rotateZ'; break;
      }
    }

    // --- 4. Handle Click & Drag ---
    if (Mouse.mouseButtonDown[0] && !this.activeHandle && this.hoveredHandle) {
      // START DRAG
      this.activeHandle = this.hoveredHandle;
      this.mouseClaimed = true;
      // We don't start the actual drag until the mouse moves past the threshold.
      this.isDragging = false;

    } else if (Mouse.mouseButtonDown[0] && this.activeHandle) {
      const mouseDeltaX = Math.abs(Mouse.mousePosition.x - Mouse.mouseClickPosition.x);
      const mouseDeltaY = Math.abs(Mouse.mousePosition.y - Mouse.mouseClickPosition.y);

      // If not yet dragging, check if the threshold is met.
      if (!this.isDragging && (mouseDeltaX > this.dragThreshold || mouseDeltaY > this.dragThreshold)) {
        this.isDragging = true;

        // This is the true start of the drag. Record initial state now.
        if (this.activeHandle.startsWith('translate')) {
          vec3.copy(this.dragStartEntityPosition, this.selectedEntity.transform.worldPosition);
        } else if (this.activeHandle.startsWith('scale')) {
          vec3.copy(this.dragStartEntityScale, this.selectedEntity.transform.localScale);
        } else if (this.activeHandle.startsWith('rotate')) {
          quat.copy(this.dragStartEntityRotation, this.selectedEntity.transform.localRotationQuat);
        }
        // Set the drag start point based on the CURRENT mouse position to avoid a jump.
        this.setDragStartPoint(Mouse.mousePosition);
      }

      // If we are actively dragging, perform the entity manipulation.
      if (this.isDragging) {
        if (this.activeHandle.startsWith('translate')) {
          this.dragTranslateEntity();
        } else if (this.activeHandle.startsWith('scale')) {
          this.dragScaleEntity();
        } else if (this.activeHandle.startsWith('rotate')) {
          this.dragRotateEntity();
        }
      }
      this.mouseClaimed = true;

    } else if (!Mouse.mouseButtonDown[0]) {
      // END DRAG
      this.activeHandle = null;
      this.isDragging = false;
    }
  }

  private setDragStartPoint(position: { x: number, y: number } = Mouse.mousePosition) {
    // Project mouse onto a plane to get a 3D starting point for the drag
    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl }, position);
    let planeNormal = vec3.create();

    if (this.activeHandle?.startsWith('rotate')) {
      if (this.activeHandle === 'rotateX') vec3.set(planeNormal, 1, 0, 0); // YZ plane
      else if (this.activeHandle === 'rotateY') vec3.set(planeNormal, 0, 1, 0); // XZ plane
      else if (this.activeHandle === 'rotateZ') vec3.set(planeNormal, 0, 0, 1); // XY plane
    } else {
      // For translate and scale, use a plane facing the camera
      vec3.sub(planeNormal, camera.transform.worldPosition, this.selectedEntity.transform.worldPosition);
      vec3.normalize(planeNormal, planeNormal);
    }

    const intersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      ray,
      this.selectedEntity.transform.worldPosition,
      planeNormal
    );

    if (intersection) {
      vec3.copy(this.dragStartPoint, intersection);
    }
  }

  private drawPickingGizmo(gizmoTransform: mat4): number {
    switch (this.gizmoMode) {
      case 'translate':
        this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_X);
        this.drawPoint(new Vector3(this.gizmoSize, 0, 0), this.handlePointSize, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Y);
        this.drawPoint(new Vector3(0, this.gizmoSize, 0), this.handlePointSize, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Z);
        this.drawPoint(new Vector3(0, 0, this.gizmoSize), this.handlePointSize, this.pickingShader);
        break;
      case 'scale':
        this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_X);
        this.drawPoint(new Vector3(this.gizmoSize, 0, 0), this.handlePointSize, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Y);
        this.drawPoint(new Vector3(0, this.gizmoSize, 0), this.handlePointSize, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Z);
        this.drawPoint(new Vector3(0, 0, this.gizmoSize), this.handlePointSize, this.pickingShader);
        break;
      case 'rotate':
        const gizmoSize = this.gizmoSize * 1.2;

        // X-Axis Ring
        const xRingMatrix = mat4.clone(gizmoTransform);
        mat4.rotateY(xRingMatrix, xRingMatrix, Math.PI / 2);
        mat4.scale(xRingMatrix, xRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, xRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_X);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_X / 255, 0, 0);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);

        // Y-Axis Ring
        const yRingMatrix = mat4.clone(gizmoTransform);
        mat4.rotateX(yRingMatrix, yRingMatrix, Math.PI / 2);
        mat4.scale(yRingMatrix, yRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, yRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_Y / 255, 0, 0);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);

        // Z-Axis Ring
        const zRingMatrix = mat4.clone(gizmoTransform);
        mat4.scale(zRingMatrix, zRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, zRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_Z / 255, 0, 0);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);
        break;
    }

    const pixel = new Uint8Array(4);
    this._gl.readPixels(Mouse.mousePosition.x, this.pickingTexture.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixel);
    return pixel[0];
  }

  private dragTranslateEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    // Define the axis we are dragging along
    const moveAxis = vec3.create();
    if (this.activeHandle === 'translateX') vec3.set(moveAxis, 1, 0, 0);
    if (this.activeHandle === 'translateY') vec3.set(moveAxis, 0, 1, 0);
    if (this.activeHandle === 'translateZ') vec3.set(moveAxis, 0, 0, 1);

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

  private dragScaleEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    const scaleAxis = vec3.create();
    if (this.activeHandle === 'scaleX') vec3.set(scaleAxis, 1, 0, 0);
    if (this.activeHandle === 'scaleY') vec3.set(scaleAxis, 0, 1, 0);
    if (this.activeHandle === 'scaleZ') vec3.set(scaleAxis, 0, 0, 1);

    const planeNormal = camera.transform.forward;
    const intersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, this.dragStartPoint, planeNormal);

    if (intersection) {
      const moveVector = vec3.sub(vec3.create(), intersection, this.dragStartPoint);

      // Project the movement onto the drag axis to get a signed magnitude
      const dragAmount = vec3.dot(moveVector, scaleAxis);

      const scaleFactor = 1.0 + dragAmount * 0.5; // Sensitivity factor

      const newScale = vec3.clone(this.dragStartEntityScale);
      if (this.activeHandle === 'scaleX') newScale[0] *= scaleFactor;
      if (this.activeHandle === 'scaleY') newScale[1] *= scaleFactor;
      if (this.activeHandle === 'scaleZ') newScale[2] *= scaleFactor;
      this.selectedEntity.transform.setLocalScale(newScale[0], newScale[1], newScale[2]);
    }
  }

 private dragRotateEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });
    const entityPosition = this.selectedEntity.transform.worldPosition;

    let planeNormal = vec3.create();
    let rotationAxis = vec3.create();

    if (this.activeHandle === 'rotateX') {
      vec3.set(planeNormal, 1, 0, 0); // Plane is YZ
      vec3.set(rotationAxis, 1, 0, 0);
    } else if (this.activeHandle === 'rotateY') {
      vec3.set(planeNormal, 0, 1, 0); // Plane is XZ
      vec3.set(rotationAxis, 0, 1, 0);
    } else if (this.activeHandle === 'rotateZ') {
      vec3.set(planeNormal, 0, 0, 1); // Plane is XY
      vec3.set(rotationAxis, 0, 0, 1);
    }

    // Find intersection of mouse ray with the rotation plane
    const currentIntersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, entityPosition, planeNormal);

    if (currentIntersection) {
      const startVector = vec3.sub(vec3.create(), this.dragStartPoint, entityPosition);
      const currentVector = vec3.sub(vec3.create(), currentIntersection, entityPosition);
      vec3.normalize(startVector, startVector);
      vec3.normalize(currentVector, currentVector);

      // Calculate the angle between the start and current vectors
      let angle = vec3.angle(startVector, currentVector);

      // Determine the direction of rotation
      const cross = vec3.cross(vec3.create(), startVector, currentVector);
      if (vec3.dot(planeNormal, cross) < 0) {
        angle = -angle;
      }

      const deltaRotation = quat.setAxisAngle(quat.create(), rotationAxis, angle);
      const newRotation = quat.multiply(quat.create(), deltaRotation, this.dragStartEntityRotation);
      this.selectedEntity.transform.setLocalRotationQuat(newRotation);
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
