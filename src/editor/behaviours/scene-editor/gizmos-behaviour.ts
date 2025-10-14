
import { mat4, quat, vec3 } from "gl-matrix";
import {
  BoundingBox, Camera, CanvasViewport, Color,
  ColorMaterial, Colors, CubePrimitive, DephFunction, GlEntity, Keybord, Mesh, MeshData,
  Mouse,
  RendererBehaviour,
  Shader, ShaderUniformsEnum,
  Texture, Transform, Vector3
} from "@engine";
import { Raycast } from "./raycast";
import { CubeHelper } from "./cube.helper"; // Assuming this will be created
import { ConeHelper } from "./cone.helper"; // Assuming this will be created
import { CircleHelper } from "./circle.helper";
import { GizmoMode } from "./gizmo-mode.enum";

import { EditorService } from "../../services/editor.service";
import { TransformSpace } from "./transform-space.enum";

/**
 * A renderer behaviour responsible for drawing bounding boxes for hovered and selected entities,
 * and for displaying and handling a 3D transformation gizmo (translate, rotate, scale) for the selected entity.
 * It uses GPU-based picking for precise gizmo handle interaction.
 */
export class GizmosBoxBehaviour extends RendererBehaviour {

  /** The color of the bounding box for the selected entity. */
  public selectedBoundingBoxColor: Color = Colors.gray;
  /** The line width for the selected entity's bounding box. */
  public selectedBoundingBoxLineWidth = 3.0;
  /** The calculated BoundingBox for the selected entity. */
  public selectedBoundingBox!: BoundingBox | null;
  /** The currently selected entity to which the gizmo is attached. */
  private selectedEntity!: GlEntity;

  /** The current transformation mode for the gizmo (translate, rotate, or scale). */
  private gizmoMode: GizmoMode = GizmoMode.Translate;
  private transformSpace: TransformSpace = TransformSpace.World;

  /** The handle currently being dragged by the user (e.g., 'translateX', 'rotateY'). */
  private activeHandle: string | null = null;
  /** The handle currently being hovered over by the user. */
  private hoveredHandle: string | null = null;

  /** The 3D world-space point where a drag operation started. */
  private dragStartPoint = vec3.create();
  /** The world position of the entity when the drag started. */
  private dragStartEntityPosition = vec3.create();

  /** The local scale of the entity when the drag started. */
  private dragStartEntityScale = vec3.create();

  /** The local rotation of the entity when the drag started. */
  private dragStartEntityRotation = quat.create();
  /** The last recorded mouse position during a drag, used for calculating relative movement. */
  private lastMousePosition = { x: 0, y: 0 };
  /** A flag indicating if a drag operation is in progress. */
  private isDragging = false;
  /** The distance in pixels the mouse must move before a drag operation begins. */
  private dragThreshold = 3;

  /** The base visual size of the gizmo in world units. */
  private gizmoSize = 1.0;
  /** A scale factor applied to the gizmo's cone and cube handles for better visibility. */
  private gizmoScale = 1.5;
  /** The size of the points used for picking the rotation gizmo handles, making them easier to click. */
  private handlePointSize = 30.0;

  /** Helper for drawing cone geometry (used for translation handles). */
  private coneHelper: ConeHelper;
  /** Helper for drawing cube geometry (used for scale handles). */
  private cubeHelper: CubeHelper;
  /** Helper for drawing circle geometry (used for rotation handles). */
  private circleHelper: CircleHelper;

  /** The off-screen texture used for GPU-based picking of gizmo handles. */
  private pickingTexture: Texture;
  /** The shader used to render object IDs to the picking texture. */
  private pickingShader: Shader;

  // --- Gizmo Handle IDs ---
  // These constants are used as unique identifiers for each gizmo handle.
  // They are rendered as colors into the picking texture.
  private readonly HANDLE_ID_TRANSLATE_X = 1;
  private readonly HANDLE_ID_TRANSLATE_Y = 2;
  private readonly HANDLE_ID_TRANSLATE_Z = 3;
  private readonly HANDLE_ID_SCALE_X = 4;
  private readonly HANDLE_ID_SCALE_Y = 5;
  private readonly HANDLE_ID_SCALE_Z = 6;
  private readonly HANDLE_ID_ROTATE_X = 7;
  private readonly HANDLE_ID_ROTATE_Y = 8;
  private readonly HANDLE_ID_ROTATE_Z = 9;

  /**
   * A flag to signal to other behaviours (like EntityPicker) that this behaviour
   * has claimed the mouse input for the current frame, preventing other interactions.
   */
  public mouseClaimed = false;

  /** The shader used for rendering the visual representation of the bounding boxes and gizmo. */
  override shader: Shader;
  /** The color of the bounding box for the hovered entity. */
  public hoveredBoundingBoxColor: Color = Colors.grey;
  /** The line width for the hovered entity's bounding box. */
  public hoveredBoundingBoxLineWidth = 1.0;
  /** The calculated BoundingBox for the hovered entity. */
  public hoveredBoundingBox!: BoundingBox | null;
  /** The currently hovered entity. */
  private hoveredEntity!: GlEntity;

  constructor(gl: WebGL2RenderingContext, private editorService: EditorService) {
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

    this.coneHelper = new ConeHelper(gl);
    this.cubeHelper = new CubeHelper(gl, this.shader, this.pickingShader);
    this.circleHelper = new CircleHelper(gl);
    this.dephMode = DephFunction.LessOrEqual;

    this.createMesh();

    this.editorService.gizmoMode.subscribe(mode => {
      this.gizmoMode = mode;
    });

    this.editorService.transformSpace.subscribe(space => {
      this.transformSpace = space;
    });
  }

  /**
   * @inheritdoc
   */
  protected createMesh() {
    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData([]);
  }

  /**
   * Sets the target entity for which to display the bounding box and gizmo.
   * @param entity The entity to select, or null to deselect.
   */
  public setTargetEntity(entity: GlEntity | null) {
    if (entity == null) {
      this.selectedBoundingBox = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);
    let vertices: vec3[] = [];
    if (!renderer) {
      console.debug("no renderer found!", entity.name);
      vertices = new CubePrimitive().vertices
    } else {
      vertices = renderer.mesh.meshData.vertices;
    }
    const box = MeshData.getBoundingBox(vertices);
    this.selectedBoundingBox = box;
    this.selectedEntity = entity;
  }

  /**
   * Sets the entity currently being hovered over to display its bounding box.
   * @param entity The entity to highlight, or null to remove the highlight.
   */
  public setHoveredEntity(entity: GlEntity | null) {
    if (entity == null) {
      this.hoveredBoundingBox = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);

    let vertices: vec3[] = [];
    if (!renderer) {
      console.debug("no renderer found!", entity.name);
      vertices = new CubePrimitive().vertices
    } else {
      vertices = renderer.mesh.meshData.vertices;
    }
    const box = MeshData.getBoundingBox(vertices);
    this.hoveredBoundingBox = box;
    this.hoveredEntity = entity;
  }

  /**
   * @inheritdoc
   */
  public override draw(): void {
    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

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

  public override updateEditor(elapsed: number): void {
    this.handleKeyboardInput();
  }

  /**
   * Handles keyboard input for switching between gizmo modes.
   * '1' for Translate, '2' for Rotate, '3' for Scale.
   */
  private handleKeyboardInput() {
    if (Keybord.keyDown["1"]) { this.gizmoMode = GizmoMode.Translate }
    if (Keybord.keyDown["2"]) { this.gizmoMode = GizmoMode.Rotate }
    if (Keybord.keyDown["3"]) { this.gizmoMode = GizmoMode.Scale }

    if (Keybord.keyDown["t"]) {
      this.transformSpace = this.transformSpace === TransformSpace.World ? TransformSpace.Local : TransformSpace.World;
      this.editorService.setTransformSpace(this.transformSpace);
    }
  }

  /**
   * Draws the currently active gizmo (translate, rotate, or scale) at the selected entity's position.
   */
  private drawGizmo() {
    if (!this.shader?._shaderProgram) return;
    this._gl.lineWidth(3);
    this._gl.clear(this._gl.DEPTH_BUFFER_BIT);

    const origin = new Vector3();
    // The gizmo should only be at the entity's position, not rotated or scaled by it.
    const gizmoTransform = mat4.create();
    if (this.transformSpace === TransformSpace.World) {
      mat4.fromTranslation(gizmoTransform, this.selectedEntity.transform.worldPosition);
    } else {
      mat4.fromRotationTranslation(gizmoTransform, this.selectedEntity.transform.worldRotationQuat, this.selectedEntity.transform.worldPosition);
    }

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

  /**
   * Draws the translation gizmo, consisting of three colored axes with cone-shaped arrowheads.
   * @param gizmoTransform The base transformation matrix for the gizmo (position only).
   */
  private drawTranslateGizmo(gizmoTransform: mat4) {
    const origin = new Vector3();
    // X-Axis (Red)
    const xColor = (this.activeHandle === 'x' || this.hoveredHandle === 'x') ? Colors.yellow : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const xEndVec = vec3.fromValues(this.gizmoSize, 0, 0);
    const xEnd = new Vector3(...xEndVec);
    this.drawLine(origin, xEnd);
    const xConeMatrix = mat4.clone(gizmoTransform);
    mat4.translate(xConeMatrix, xConeMatrix, xEndVec);
    mat4.rotateZ(xConeMatrix, xConeMatrix, -Math.PI / 2); // Rotate cone to point along X
    mat4.scale(xConeMatrix, xConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    this.setMatrices(this.selectedEntity.transform, xConeMatrix, this.shader);
    this.coneHelper.draw(this.shader);

    // Y-Axis (Green)
    const yColor = (this.activeHandle === 'y' || this.hoveredHandle === 'y') ? Colors.yellow : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const yEndVec = vec3.fromValues(0, this.gizmoSize, 0);
    const yEnd = new Vector3(...yEndVec);
    this.drawLine(origin, yEnd);
    const yConeMatrix = mat4.clone(gizmoTransform);
    mat4.translate(yConeMatrix, yConeMatrix, yEndVec);
    mat4.scale(yConeMatrix, yConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    this.setMatrices(this.selectedEntity.transform, yConeMatrix, this.shader);
    this.coneHelper.draw(this.shader);

    // Z-Axis (Blue)
    const zColor = (this.activeHandle === 'z' || this.hoveredHandle === 'z') ? Colors.yellow : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    this.setMatrices(this.selectedEntity.transform, gizmoTransform, this.shader);
    const zEndVec = vec3.fromValues(0, 0, this.gizmoSize);
    const zEnd = new Vector3(...zEndVec);
    this.drawLine(origin, zEnd);
    const zConeMatrix = mat4.clone(gizmoTransform);
    mat4.translate(zConeMatrix, zConeMatrix, zEndVec);
    mat4.rotateX(zConeMatrix, zConeMatrix, Math.PI / 2); // Rotate cone to point along Z
    mat4.scale(zConeMatrix, zConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
    this.setMatrices(this.selectedEntity.transform, zConeMatrix, this.shader);
    this.coneHelper.draw(this.shader);
  }

  /**
   * Draws the scale gizmo, consisting of three colored axes with cube-shaped handles.
   * @param gizmoTransform The base transformation matrix for the gizmo (position only).
   */
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

  /**
   * Draws the rotation gizmo, consisting of three colored rings aligned to the X, Y, and Z axes.
   * @param gizmoTransform The base transformation matrix for the gizmo (position only).
   */
  private drawRotateGizmo(gizmoTransform: mat4) {
    const gizmoSize = this.gizmoSize * 1.2; // Make rings a bit larger

    // X-Axis Ring (Red) - Rotated around Y-axis to be on the YZ plane
    const xColor = (this.activeHandle === 'rotateX' || this.hoveredHandle === 'rotateX') ? Colors.yellow : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    const xRingMatrix = mat4.clone(gizmoTransform);
    mat4.rotateY(xRingMatrix, xRingMatrix, Math.PI / 2);
    mat4.scale(xRingMatrix, xRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, xRingMatrix, this.shader!);
    this.circleHelper.draw(this.shader!);

    // Y-Axis Ring (Green) - Rotated around X-axis to be on the XZ plane
    const yColor = (this.activeHandle === 'rotateY' || this.hoveredHandle === 'rotateY') ? Colors.yellow : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    const yRingMatrix = mat4.clone(gizmoTransform);
    mat4.rotateX(yRingMatrix, yRingMatrix, Math.PI / 2);
    mat4.scale(yRingMatrix, yRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, yRingMatrix, this.shader!);
    this.circleHelper.draw(this.shader!);

    // Z-Axis Ring (Blue) - No rotation needed, it's on the XY plane by default
    const zColor = (this.activeHandle === 'rotateZ' || this.hoveredHandle === 'rotateZ') ? Colors.yellow : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    const zRingMatrix = mat4.clone(gizmoTransform);
    mat4.scale(zRingMatrix, zRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
    this.setMatrices(this.selectedEntity.transform, zRingMatrix, this.shader!);
    this.circleHelper.draw(this.shader!);
  }


  /**
   * Manages the entire gizmo interaction lifecycle for a single frame.
   * This includes rendering the gizmo for picking, detecting hovers and clicks, and handling drag operations.
   */
  private handleGizmoInteraction() {
    this.mouseClaimed = !!this.activeHandle || this.isDragging;

    if (!this.selectedEntity) {
      this.activeHandle = null;
      this.hoveredHandle = null;
      return;
    }

    // 1. Gizmo Picking Render Pass
    this.refreshTexture();
    this.startPass(this.pickingTexture.glTexture!, this.pickingTexture.width, this.pickingTexture.height);

    this.pickingShader.use();
    const gizmoTransform = mat4.create();
    if (this.transformSpace === TransformSpace.World) {
      mat4.fromTranslation(gizmoTransform, this.selectedEntity.transform.worldPosition);
    } else {
      mat4.fromRotationTranslation(gizmoTransform, this.selectedEntity.transform.worldRotationQuat, this.selectedEntity.transform.worldPosition);
    }

    const handleId = this.drawPickingGizmo(gizmoTransform);

    this.endPass();

    // 2. Update Hover/Active State
    // If we are not currently dragging, update the hovered handle based on the picking result.
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

    // 3. Handle Click & Drag Logic
    if (Mouse.mouseButtonDown[0] && !this.activeHandle && this.hoveredHandle) {
      // MOUSE DOWN on a handle: Capture the initial state for a potential drag.
      this.activeHandle = this.hoveredHandle;
      this.mouseClaimed = true;
      this.lastMousePosition.x = Mouse.mousePosition.x;
      this.lastMousePosition.y = Mouse.mousePosition.y;

    } else if (Mouse.mouseButtonDown[0] && this.activeHandle) {
      // HOLDING mouse down on a handle
      const dx = Mouse.mousePosition.x - this.lastMousePosition.x;
      const dy = Mouse.mousePosition.y - this.lastMousePosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this.isDragging && dist > this.dragThreshold) {
        // START DRAG: The mouse has moved beyond the threshold, so begin the drag operation.
        this.isDragging = true;
        if (this.activeHandle.startsWith(GizmoMode.Translate)) {
          vec3.copy(this.dragStartEntityPosition, this.selectedEntity.transform.worldPosition);
        } else if (this.activeHandle.startsWith('scale')) {
          vec3.copy(this.dragStartEntityScale, this.selectedEntity.transform.localScale);
        } else if (this.activeHandle.startsWith('rotate')) {
          quat.copy(this.dragStartEntityRotation, this.selectedEntity.transform.localRotationQuat);
        }
        this.setDragStartPoint(); // Set the 3D start point for translation/scaling
      }

      if (this.isDragging) {
        // DRAGGING: Apply the transformation for the current frame.
        if (this.activeHandle.startsWith(GizmoMode.Translate)) {
          this.dragTranslateEntity();
        } else if (this.activeHandle.startsWith(GizmoMode.Scale)) {
          this.dragScaleEntity();
        } else if (this.activeHandle.startsWith(GizmoMode.Rotate)) {
          this.dragRotateEntity();
        }
        this.mouseClaimed = true;
      }

      this.lastMousePosition.x = Mouse.mousePosition.x;
      this.lastMousePosition.y = Mouse.mousePosition.y;

    } else if (!Mouse.mouseButtonDown[0]) {
      // MOUSE UP: End the drag operation and reset state.
      this.activeHandle = null;
      this.isDragging = false;
    }
  }

  /**
   * Calculates the 3D world-space point where a drag operation begins.
   * This is done by intersecting the mouse ray with a plane that is aligned with the camera and passes through the entity's origin.
   */
  private setDragStartPoint() {
    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });
    const planeNormal = vec3.sub(vec3.create(), camera.transform.worldPosition, this.selectedEntity.transform.worldPosition);
    vec3.normalize(planeNormal, planeNormal);

    const intersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, this.selectedEntity.transform.worldPosition, planeNormal);
    if (intersection) {
      vec3.copy(this.dragStartPoint, intersection);
    }
  }

  /**
   * Renders the gizmo handles to an off-screen texture using unique colors for each handle.
   * It then reads the pixel color at the mouse position to determine which handle (if any) is being hovered over.
   * @param gizmoTransform The base transformation matrix for the gizmo (position only).
   * @returns The ID of the handle under the mouse cursor, or 0 if none.
   */
  private drawPickingGizmo(gizmoTransform: mat4): number {
    switch (this.gizmoMode) {
      case GizmoMode.Translate:
        const xConeMatrix = mat4.translate(mat4.create(), gizmoTransform, [this.gizmoSize, 0, 0]);
        mat4.rotateZ(xConeMatrix, xConeMatrix, -Math.PI / 2);
        mat4.scale(xConeMatrix, xConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
        this.setMatrices(this.selectedEntity.transform, xConeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_X);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_TRANSLATE_X / 255, 0, 0);
        this.coneHelper.draw(this.pickingShader);

        const yConeMatrix = mat4.translate(mat4.create(), gizmoTransform, [0, this.gizmoSize, 0]);
        mat4.scale(yConeMatrix, yConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
        this.setMatrices(this.selectedEntity.transform, yConeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_TRANSLATE_Y / 255, 0, 0);
        this.coneHelper.draw(this.pickingShader);

        const zConeMatrix = mat4.translate(mat4.create(), gizmoTransform, [0, 0, this.gizmoSize]);
        mat4.rotateX(zConeMatrix, zConeMatrix, Math.PI / 2);
        mat4.scale(zConeMatrix, zConeMatrix, [this.gizmoScale, this.gizmoScale, this.gizmoScale]);
        this.setMatrices(this.selectedEntity.transform, zConeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_TRANSLATE_Z / 255, 0, 0);
        this.coneHelper.draw(this.pickingShader);
        break;
      case GizmoMode.Scale:
        const xCubeMatrix = mat4.translate(mat4.create(), gizmoTransform, [this.gizmoSize, 0, 0]);
        this.setMatrices(this.selectedEntity.transform, xCubeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_X);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_SCALE_X / 255, 0, 0, 1);
        this.cubeHelper.draw(xCubeMatrix, (this.pickingShader.material as ColorMaterial).color, this.pickingShader);

        const yCubeMatrix = mat4.translate(mat4.create(), gizmoTransform, [0, this.gizmoSize, 0]);
        this.setMatrices(this.selectedEntity.transform, yCubeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_SCALE_Y / 255, 0, 0, 1);
        this.cubeHelper.draw(yCubeMatrix, (this.pickingShader.material as ColorMaterial).color, this.pickingShader);

        const zCubeMatrix = mat4.translate(mat4.create(), gizmoTransform, [0, 0, this.gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, zCubeMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_SCALE_Z / 255, 0, 0, 1);
        this.cubeHelper.draw(zCubeMatrix, (this.pickingShader.material as ColorMaterial).color, this.pickingShader);
        break;
      case GizmoMode.Rotate:
        const gizmoSize = this.gizmoSize * 1.2;

        // X-Axis Ring
        const xRingMatrix = mat4.clone(gizmoTransform);
        mat4.rotateY(xRingMatrix, xRingMatrix, Math.PI / 2);
        mat4.scale(xRingMatrix, xRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, xRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_X);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_X / 255, 0, 0, 1);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);

        // Y-Axis Ring
        const yRingMatrix = mat4.clone(gizmoTransform);
        mat4.rotateX(yRingMatrix, yRingMatrix, Math.PI / 2);
        mat4.scale(yRingMatrix, yRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, yRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_Y / 255, 0, 0, 1);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);

        // Z-Axis Ring
        const zRingMatrix = mat4.clone(gizmoTransform);
        mat4.scale(zRingMatrix, zRingMatrix, [gizmoSize, gizmoSize, gizmoSize]);
        this.setMatrices(this.selectedEntity.transform, zRingMatrix, this.pickingShader);
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(this.HANDLE_ID_ROTATE_Z / 255, 0, 0, 1);
        this.circleHelper.draw(this.pickingShader, this.handlePointSize, true);
        break;
    }

    const pixel = new Uint8Array(4);
    this._gl.readPixels(Mouse.mousePosition.x, this.pickingTexture.height - Mouse.mousePosition.y, 1, 1, this._gl.RGBA, this._gl.UNSIGNED_BYTE, pixel);
    return pixel[0];
  }

  /**
   * Handles the logic for translating the entity along a single axis during a drag operation.
   */
  private dragTranslateEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    const moveAxis = vec3.create();
    if (this.transformSpace === TransformSpace.World) {
      if (this.activeHandle === 'translateX') vec3.set(moveAxis, 1, 0, 0);
      if (this.activeHandle === 'translateY') vec3.set(moveAxis, 0, 1, 0);
      if (this.activeHandle === 'translateZ') vec3.set(moveAxis, 0, 0, 1);
    } else {
      if (this.activeHandle === 'translateX') vec3.copy(moveAxis, this.selectedEntity.transform.right);
      if (this.activeHandle === 'translateY') vec3.copy(moveAxis, this.selectedEntity.transform.up);
      if (this.activeHandle === 'translateZ') vec3.copy(moveAxis, this.selectedEntity.transform.forward);
    }

    // We cast a ray from the camera to a virtual plane that is facing the camera and contains the drag start point.
    // This gives us a 3D representation of the mouse's movement.
    const planeNormal = camera.transform.forward;
    const intersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, this.dragStartPoint, planeNormal);

    if (intersection) {
      const moveVector = vec3.sub(vec3.create(), intersection, this.dragStartPoint);
      const projectedLength = vec3.dot(moveVector, moveAxis);
      const newPosition = vec3.scaleAndAdd(vec3.create(), this.dragStartEntityPosition, moveAxis, projectedLength);
      this.selectedEntity.transform.setWorldPosition(newPosition[0], newPosition[1], newPosition[2]);
      this.selectedEntity.transform.updateMatrices();
    }
  }

  /**
   * Handles the logic for scaling the entity along a single axis during a drag operation.
   */
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

  /**
   * Handles the logic for rotating the entity around a single axis during a drag operation.
   */
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
    const lastRay = Raycast.screenPointToRay(camera, { webgl: this._gl }, this.lastMousePosition);
    const lastIntersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, lastRay, entityPosition, planeNormal);
    const currentIntersection = Raycast.intersectRayWithPlane(camera.transform.worldPosition, ray, entityPosition, planeNormal);

    if (currentIntersection && lastIntersection) {
      const lastVector = vec3.sub(vec3.create(), lastIntersection, entityPosition);
      const currentVector = vec3.sub(vec3.create(), currentIntersection, entityPosition);
      vec3.normalize(lastVector, lastVector);
      vec3.normalize(currentVector, currentVector);

      // Calculate the angle between the start and current vectors
      let angle = vec3.angle(lastVector, currentVector);

      // Determine the direction of rotation
      const cross = vec3.cross(vec3.create(), lastVector, currentVector);
      if (vec3.dot(planeNormal, cross) < 0) {
        angle = -angle;
      }

      const deltaRotation = quat.setAxisAngle(quat.create(), rotationAxis, angle);
      const currentRotation = this.selectedEntity.transform.localRotationQuat;

      const newRotation = quat.create();
      if (this.transformSpace === TransformSpace.Local) {
        quat.multiply(newRotation, deltaRotation, currentRotation);
      } else {
        quat.multiply(newRotation, currentRotation, deltaRotation);
      }

      this.selectedEntity.transform.setLocalRotationQuat(newRotation);
    }
  }

  /**
   * Overridden to prevent default camera matrix setup, as this behaviour handles its own matrices.
   */
  protected override setCameraMatrices(): void { }

  /**
   * Sets the Model-View-Projection (MVP) matrix uniform for a given shader.
   * @param transform The transform of the object being drawn.
   * @param modelMatrix An optional model matrix to use instead of the transform's matrix.
   * @param shader The shader to set the uniform on. Defaults to the main `shader`.
   */
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

  /**
   * Draws the wireframe of a bounding box.
   * @param boundingBox The bounding box to draw.
   * @param spacing An optional padding to add around the box.
   */
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

  /**
   * Refreshes the picking texture if the canvas viewport has been resized.
   * This ensures the picking buffer matches the display buffer dimensions.
   */
  private refreshTexture() {
    if (this.pickingTexture.width !== CanvasViewport.rendererWidth || this.pickingTexture.height !== CanvasViewport.rendererHeight) {
      this.pickingTexture.destroy();
      this.pickingTexture = Texture.create(this._gl, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight, null);
    }
  }
}
