import {
  BoundingBox,
  Camera,
  CanvasViewport,
  Color,
  ColorMaterial,
  Colors,
  CubePrimitive,
  DephFunction,
  SceneEntity,
  Keybord,
  MeshData,
  Mouse,
  RendererBehaviour,
  Shader,
  ShaderSources,
  ShaderUniformsEnum,
  Texture,
  Transform,
  Vector3,
} from 'omega-game-engine';
import { mat4, quat, vec3 } from 'gl-matrix';
import { ConeHelper } from './cone.helper';
import { CubeHelper } from './cube.helper';
import { GizmoMode } from './gizmo-mode.enum';
import { PlaneHelper } from './plane.helper';
import { Raycast } from './raycast';
import { TorusHelper } from './torus.helper';

import { EditorService } from '../../services/editor.service';
import { ScaleBoxHelper } from './scale-box.helper';
import { TransformSpace } from './transform-space.enum';

export class GizmosBoxBehaviour extends RendererBehaviour {
  public selectedBoundingBoxColor: Color = Colors.gray;
  public selectedBoundingBoxLineWidth = 3.0;
  public selectedBoundingBox!: BoundingBox | null;
  private selectedEntity!: SceneEntity;

  private gizmoMode: GizmoMode = GizmoMode.Translate;
  private transformSpace: TransformSpace = TransformSpace.Local;

  private activeHandle: string | null = null;
  private hoveredHandle: string | null = null;

  private dragStartPoint = vec3.create();
  private dragStartEntityPosition = vec3.create();
  private dragStartEntityScale = vec3.create();
  private dragStartEntityRotation = quat.create();

  private lastMousePosition = { x: 0, y: 0 };
  private lastHoverMouseX = -1;
  private lastHoverMouseY = -1;

  private isDragging = false;
  private dragThreshold = 3;

  private gizmoSize = 1.0;
  private gizmoScale = 1.5;
  private handlePointSize = 30.0;

  private coneHelper: ConeHelper;
  private cubeHelper: CubeHelper;
  private planeHelper: PlaneHelper;

  private visualTorusHelper: TorusHelper;
  private pickingTorusHelper: TorusHelper;
  private scaleBoxHelper: ScaleBoxHelper;

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

  private readonly HANDLE_ID_TRANSLATE_XY = 10;
  private readonly HANDLE_ID_TRANSLATE_XZ = 11;
  private readonly HANDLE_ID_TRANSLATE_YZ = 12;

  public mouseClaimed = false;

  override shader: Shader;
  public hoveredBoundingBoxColor: Color = Colors.grey;
  public hoveredBoundingBoxLineWidth = 1.0;
  public hoveredBoundingBox!: BoundingBox | null;
  private hoveredEntity!: SceneEntity;

  private readonly _origin = new Vector3(0, 0, 0);
  private readonly _gizmoTransform = mat4.create();
  private readonly _tempMatrix1 = mat4.create();

  private readonly _xEndVec = vec3.create();
  private readonly _yEndVec = vec3.create();
  private readonly _zEndVec = vec3.create();

  private readonly _xEnd = new Vector3(0, 0, 0);
  private readonly _yEnd = new Vector3(0, 0, 0);
  private readonly _zEnd = new Vector3(0, 0, 0);

  private readonly _p1 = new Vector3(0, 0, 0);
  private readonly _p2 = new Vector3(0, 0, 0);

  private readonly _pickingPixel = new Uint8Array(4);

  private readonly _moveAxis = vec3.create();
  private readonly _scaleAxis = vec3.create();
  private readonly _planeNormal = vec3.create();
  private readonly _rotationAxis = vec3.create();
  private readonly _crossProduct = vec3.create();

  private readonly _moveVector = vec3.create();
  private readonly _lastVector = vec3.create();
  private readonly _currentVector = vec3.create();

  private readonly _newPosition = vec3.create();
  private readonly _newScale = vec3.create();
  private readonly _deltaRotation = quat.create();
  private readonly _newRotation = quat.create();

  private readonly _bbTopLeftFar = new Vector3(0, 0, 0);
  private readonly _bbTopLeftNear = new Vector3(0, 0, 0);
  private readonly _bbBottomLeftFar = new Vector3(0, 0, 0);
  private readonly _bbBottomLeftNear = new Vector3(0, 0, 0);
  private readonly _bbTopRightFar = new Vector3(0, 0, 0);
  private readonly _bbTopRightNear = new Vector3(0, 0, 0);
  private readonly _bbBottomRightFar = new Vector3(0, 0, 0);
  private readonly _bbBottomRightNear = new Vector3(0, 0, 0);

  constructor(
    gl: WebGL2RenderingContext,
    private editorService: EditorService,
  ) {
    super(gl);
    const material = new ColorMaterial();
    this.shader = new Shader(this._gl, material);
    this.shader!.initialize();

    this.pickingShader = new Shader(
      this._gl,
      new ColorMaterial(),
      ShaderSources.frag.entity_picker,
    );
    this.pickingShader.initialize();

    this.pickingTexture = Texture.create(
      gl,
      CanvasViewport.rendererWidth,
      CanvasViewport.rendererHeight,
      null,
    );

    this.coneHelper = new ConeHelper(gl);
    this.cubeHelper = new CubeHelper(gl, this.shader, this.pickingShader);
    this.planeHelper = new PlaneHelper(gl);

    // Thin tube for elegant rendering, very fat tube for foolproof mouse picking
    this.visualTorusHelper = new TorusHelper(gl, 1.0, 0.02);
    this.pickingTorusHelper = new TorusHelper(gl, 1.0, 0.08);
    this.scaleBoxHelper = new ScaleBoxHelper(gl);

    this.dephMode = DephFunction.LessOrEqual;

    this.createMesh();

    this.editorService.gizmoMode.subscribe((mode) => {
      this.gizmoMode = mode;
    });

    this.editorService.transformSpace.subscribe((space) => {
      this.transformSpace = space;
    });
  }

  protected createMesh() {}

  public setTargetEntity(entity: SceneEntity | null) {
    if (entity == null) {
      this.selectedBoundingBox = null;
      this.selectedEntity = null as any;
      this.activeHandle = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);
    let vertices: vec3[] = [];
    if (!renderer) {
      vertices = new CubePrimitive().vertices;
    } else {
      vertices = renderer.mesh.meshData.vertices;
    }
    const box = MeshData.getBoundingBox(vertices);
    this.selectedBoundingBox = box;
    this.selectedEntity = entity;
  }

  public setHoveredEntity(entity: SceneEntity | null) {
    if (entity == null) {
      this.hoveredBoundingBox = null;
      this.hoveredEntity = null as any;
      this.hoveredHandle = null;
      return;
    }
    const renderer = entity.getBehaviour(RendererBehaviour);

    let vertices: vec3[] = [];
    if (!renderer) {
      vertices = new CubePrimitive().vertices;
    } else {
      vertices = renderer.mesh.meshData.vertices;
    }
    const box = MeshData.getBoundingBox(vertices);
    this.hoveredBoundingBox = box;
    this.hoveredEntity = entity;
  }

  public override draw(): void {
    if (!this.shader?._shaderProgram) return;
    if (!this._initialized) super.initialize();

    this.handleGizmoInteraction();

    this.shader!.use();
    this.setShaderVariables();

    if (this.selectedBoundingBox && this.selectedEntity) {
      this._gl.lineWidth(this.selectedBoundingBoxLineWidth);
      this.shader!.material.color.set(
        ...this.selectedBoundingBoxColor.toVec4(),
      );
      this.shader!.setMat4(
        ShaderUniformsEnum.U_MODEL_MATRIX,
        this.selectedEntity.transform.modelMatrix,
      );
      this.setMatrices(this.selectedEntity.transform);
      this.drawBoundingBox(this.selectedBoundingBox);
    }

    if (this.selectedEntity) {
      this.drawGizmo();
    }

    if (this.hoveredBoundingBox && this.hoveredEntity) {
      this._gl.lineWidth(this.hoveredBoundingBoxLineWidth);
      this.shader.material.color.set(...this.hoveredBoundingBoxColor.toVec4());
      this.shader.setMat4(
        ShaderUniformsEnum.U_MODEL_MATRIX,
        this.hoveredEntity.transform.modelMatrix,
      );
      this.setMatrices(this.hoveredEntity.transform);
      this.drawBoundingBox(this.hoveredBoundingBox);
    }
    this._gl.lineWidth(1);
  }

  public override updateEditor(elapsed: number): void {
    this.handleKeyboardInput();
  }

  private handleKeyboardInput() {
    if (Keybord.keyDown['1']) {
      this.gizmoMode = GizmoMode.Translate;
    }
    if (Keybord.keyDown['2']) {
      this.gizmoMode = GizmoMode.Rotate;
    }
    if (Keybord.keyDown['3']) {
      this.gizmoMode = GizmoMode.Scale;
    }

    if (Keybord.keyUp['t']) {
      this.transformSpace =
        this.transformSpace === TransformSpace.World
          ? TransformSpace.Local
          : TransformSpace.World;
      this.editorService.setTransformSpace(this.transformSpace);
    }
  }

  private drawGizmo() {
    if (!this.shader?._shaderProgram) return;
    this._gl.lineWidth(3);
    this._gl.clear(this._gl.DEPTH_BUFFER_BIT);

    if (this.transformSpace === TransformSpace.World) {
      mat4.fromTranslation(
        this._gizmoTransform,
        this.selectedEntity.transform.worldPosition,
      );
    } else {
      mat4.fromRotationTranslation(
        this._gizmoTransform,
        this.selectedEntity.transform.worldRotationQuat,
        this.selectedEntity.transform.worldPosition,
      );
    }

    switch (this.gizmoMode) {
      case 'translate':
        this.drawTranslateGizmo(this._gizmoTransform);
        break;
      case 'scale':
        this.drawScaleGizmo(this._gizmoTransform);
        break;
      case 'rotate':
        this.drawRotateGizmo(this._gizmoTransform);
        break;
      default:
        this.drawTranslateGizmo(this._gizmoTransform);
        break;
    }

    this._gl.lineWidth(1);
  }

  private drawTranslateGizmo(gizmoTransform: mat4) {
    const origin = this._origin;

    // --- 1D Arrows ---
    const xColor =
      this.activeHandle === 'x' || this.hoveredHandle === 'translateX'
        ? Colors.yellow
        : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader,
    );
    vec3.set(this._xEndVec, this.gizmoSize, 0, 0);
    this._xEnd.x = this.gizmoSize;
    this._xEnd.y = 0;
    this._xEnd.z = 0;
    this.drawLine(origin, this._xEnd);
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._xEndVec);
    mat4.rotateZ(this._tempMatrix1, this._tempMatrix1, -Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      this.gizmoScale,
      this.gizmoScale,
      this.gizmoScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.coneHelper.draw(this.shader);

    const yColor =
      this.activeHandle === 'y' || this.hoveredHandle === 'translateY'
        ? Colors.yellow
        : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader,
    );
    vec3.set(this._yEndVec, 0, this.gizmoSize, 0);
    this._yEnd.x = 0;
    this._yEnd.y = this.gizmoSize;
    this._yEnd.z = 0;
    this.drawLine(origin, this._yEnd);
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._yEndVec);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      this.gizmoScale,
      this.gizmoScale,
      this.gizmoScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.coneHelper.draw(this.shader);

    const zColor =
      this.activeHandle === 'z' || this.hoveredHandle === 'translateZ'
        ? Colors.yellow
        : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader,
    );
    vec3.set(this._zEndVec, 0, 0, this.gizmoSize);
    this._zEnd.x = 0;
    this._zEnd.y = 0;
    this._zEnd.z = this.gizmoSize;
    this.drawLine(origin, this._zEnd);
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._zEndVec);
    mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      this.gizmoScale,
      this.gizmoScale,
      this.gizmoScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.coneHelper.draw(this.shader);

    // --- 2D Solid Planes ---
    const pSize = this.gizmoSize * 0.45;
    const offset = this.gizmoSize * 0.1;

    this._gl.disable(this._gl.CULL_FACE);
    this._gl.enable(this._gl.BLEND);
    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

    // 1. XY Plane (Blue Tone - Perpendicular to Z)
    const xyHover =
      this.activeHandle === 'translateXY' ||
      this.hoveredHandle === 'translateXY';
    const xyC = (xyHover ? Colors.yellow : Colors.blue).toVec4();
    this.shader!.material.color.set(
      xyC[0],
      xyC[1],
      xyC[2],
      xyHover ? 0.8 : 0.3,
    );
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, [offset, offset, 0]);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.planeHelper.drawSolid(this.shader);

    this.shader!.material.color.set(
      xyC[0],
      xyC[1],
      xyC[2],
      xyHover ? 1.0 : 0.6,
    );
    this.shader!.loadDataIntoShader();
    this.planeHelper.drawLines(this.shader);

    // 2. XZ Plane (Green Tone - Perpendicular to Y)
    const xzHover =
      this.activeHandle === 'translateXZ' ||
      this.hoveredHandle === 'translateXZ';
    const xzC = (xzHover ? Colors.yellow : Colors.green).toVec4();
    this.shader!.material.color.set(
      xzC[0],
      xzC[1],
      xzC[2],
      xzHover ? 0.8 : 0.3,
    );
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, [offset, 0, offset]);
    mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.planeHelper.drawSolid(this.shader);

    this.shader!.material.color.set(
      xzC[0],
      xzC[1],
      xzC[2],
      xzHover ? 1.0 : 0.6,
    );
    this.shader!.loadDataIntoShader();
    this.planeHelper.drawLines(this.shader);

    // 3. YZ Plane (Red Tone - Perpendicular to X)
    const yzHover =
      this.activeHandle === 'translateYZ' ||
      this.hoveredHandle === 'translateYZ';
    const yzC = (yzHover ? Colors.yellow : Colors.red).toVec4();
    this.shader!.material.color.set(
      yzC[0],
      yzC[1],
      yzC[2],
      yzHover ? 0.8 : 0.3,
    );
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, [0, offset, offset]);
    mat4.rotateY(this._tempMatrix1, this._tempMatrix1, -Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.planeHelper.drawSolid(this.shader);

    this.shader!.material.color.set(
      yzC[0],
      yzC[1],
      yzC[2],
      yzHover ? 1.0 : 0.6,
    );
    this.shader!.loadDataIntoShader();
    this.planeHelper.drawLines(this.shader);

    this._gl.disable(this._gl.BLEND);
    this._gl.enable(this._gl.CULL_FACE);
  }

  private drawScaleGizmo(gizmoTransform: mat4) {
    const origin = this._origin;
    const boxScale = this.gizmoSize * 0.15; // Clean, constant visual size

    // X-Axis (Red)
    const xColor =
      this.activeHandle === 'scaleX' || this.hoveredHandle === 'scaleX'
        ? Colors.yellow
        : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader,
    );
    vec3.set(this._xEndVec, this.gizmoSize, 0, 0);
    this._xEnd.x = this.gizmoSize;
    this._xEnd.y = 0;
    this._xEnd.z = 0;
    this.drawLine(origin, this._xEnd);

    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._xEndVec);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      boxScale,
      boxScale,
      boxScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.scaleBoxHelper.draw(this.shader);

    // Y-Axis (Green)
    const yColor =
      this.activeHandle === 'scaleY' || this.hoveredHandle === 'scaleY'
        ? Colors.yellow
        : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader!,
    );
    vec3.set(this._yEndVec, 0, this.gizmoSize, 0);
    this._yEnd.x = 0;
    this._yEnd.y = this.gizmoSize;
    this._yEnd.z = 0;
    this.drawLine(origin, this._yEnd);

    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._yEndVec);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      boxScale,
      boxScale,
      boxScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.scaleBoxHelper.draw(this.shader);

    // Z-Axis (Blue)
    const zColor =
      this.activeHandle === 'scaleZ' || this.hoveredHandle === 'scaleZ'
        ? Colors.yellow
        : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    this.shader!.loadDataIntoShader();
    this.setMatrices(
      this.selectedEntity.transform,
      gizmoTransform,
      this.shader!,
    );
    vec3.set(this._zEndVec, 0, 0, this.gizmoSize);
    this._zEnd.x = 0;
    this._zEnd.y = 0;
    this._zEnd.z = this.gizmoSize;
    this.drawLine(origin, this._zEnd);

    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.translate(this._tempMatrix1, this._tempMatrix1, this._zEndVec);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      boxScale,
      boxScale,
      boxScale,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader,
    );
    this.scaleBoxHelper.draw(this.shader);
  }

  private drawRotateGizmo(gizmoTransform: mat4) {
    const gizmoSize = this.gizmoSize * 1.2;

    const xColor =
      this.activeHandle === 'rotateX' || this.hoveredHandle === 'rotateX'
        ? Colors.yellow
        : Colors.red;
    this.shader!.material.color.set(...xColor.toVec4());
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.rotateY(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      gizmoSize,
      gizmoSize,
      gizmoSize,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader!,
    );
    this.visualTorusHelper.draw(this.shader!);

    const yColor =
      this.activeHandle === 'rotateY' || this.hoveredHandle === 'rotateY'
        ? Colors.yellow
        : Colors.green;
    this.shader!.material.color.set(...yColor.toVec4());
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      gizmoSize,
      gizmoSize,
      gizmoSize,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader!,
    );
    this.visualTorusHelper.draw(this.shader!);

    const zColor =
      this.activeHandle === 'rotateZ' || this.hoveredHandle === 'rotateZ'
        ? Colors.yellow
        : Colors.blue;
    this.shader!.material.color.set(...zColor.toVec4());
    this.shader!.loadDataIntoShader();
    mat4.copy(this._tempMatrix1, gizmoTransform);
    mat4.scale(this._tempMatrix1, this._tempMatrix1, [
      gizmoSize,
      gizmoSize,
      gizmoSize,
    ]);
    this.setMatrices(
      this.selectedEntity.transform,
      this._tempMatrix1,
      this.shader!,
    );
    this.visualTorusHelper.draw(this.shader!);
  }

  private handleGizmoInteraction() {
    this.mouseClaimed = !!this.activeHandle || this.isDragging;

    if (!this.selectedEntity) {
      this.activeHandle = null;
      this.hoveredHandle = null;
      return;
    }

    const mouseMoved =
      this.lastHoverMouseX !== Mouse.mousePosition.x ||
      this.lastHoverMouseY !== Mouse.mousePosition.y;

    if (!this.activeHandle && mouseMoved) {
      this.refreshTexture();
      this.startPass(
        this.pickingTexture.glTexture!,
        this.pickingTexture.width,
        this.pickingTexture.height,
      );

      this._gl.clearColor(0, 0, 0, 0);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

      this.pickingShader.use();
      if (this.transformSpace === TransformSpace.World) {
        mat4.fromTranslation(
          this._gizmoTransform,
          this.selectedEntity.transform.worldPosition,
        );
      } else {
        mat4.fromRotationTranslation(
          this._gizmoTransform,
          this.selectedEntity.transform.worldRotationQuat,
          this.selectedEntity.transform.worldPosition,
        );
      }

      const handleId = this.drawPickingGizmo(this._gizmoTransform);
      this.endPass();

      this.hoveredHandle = null;
      switch (handleId) {
        case this.HANDLE_ID_TRANSLATE_X:
          this.hoveredHandle = 'translateX';
          break;
        case this.HANDLE_ID_TRANSLATE_Y:
          this.hoveredHandle = 'translateY';
          break;
        case this.HANDLE_ID_TRANSLATE_Z:
          this.hoveredHandle = 'translateZ';
          break;
        case this.HANDLE_ID_TRANSLATE_XY:
          this.hoveredHandle = 'translateXY';
          break;
        case this.HANDLE_ID_TRANSLATE_XZ:
          this.hoveredHandle = 'translateXZ';
          break;
        case this.HANDLE_ID_TRANSLATE_YZ:
          this.hoveredHandle = 'translateYZ';
          break;
        case this.HANDLE_ID_SCALE_X:
          this.hoveredHandle = 'scaleX';
          break;
        case this.HANDLE_ID_SCALE_Y:
          this.hoveredHandle = 'scaleY';
          break;
        case this.HANDLE_ID_SCALE_Z:
          this.hoveredHandle = 'scaleZ';
          break;
        case this.HANDLE_ID_ROTATE_X:
          this.hoveredHandle = 'rotateX';
          break;
        case this.HANDLE_ID_ROTATE_Y:
          this.hoveredHandle = 'rotateY';
          break;
        case this.HANDLE_ID_ROTATE_Z:
          this.hoveredHandle = 'rotateZ';
          break;
      }

      this.lastHoverMouseX = Mouse.mousePosition.x;
      this.lastHoverMouseY = Mouse.mousePosition.y;
    }

    if (Mouse.mouseButtonDown[0] && !this.activeHandle && this.hoveredHandle) {
      this.activeHandle = this.hoveredHandle;
      this.mouseClaimed = true;
      this.lastMousePosition.x = Mouse.mousePosition.x;
      this.lastMousePosition.y = Mouse.mousePosition.y;
    } else if (Mouse.mouseButtonDown[0] && this.activeHandle) {
      const dx = Mouse.mousePosition.x - this.lastMousePosition.x;
      const dy = Mouse.mousePosition.y - this.lastMousePosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this.isDragging && dist > this.dragThreshold) {
        this.isDragging = true;
        if (this.activeHandle.startsWith(GizmoMode.Translate)) {
          vec3.copy(
            this.dragStartEntityPosition,
            this.selectedEntity.transform.worldPosition,
          );
        } else if (this.activeHandle.startsWith('scale')) {
          vec3.copy(
            this.dragStartEntityScale,
            this.selectedEntity.transform.localScale,
          );
        } else if (this.activeHandle.startsWith('rotate')) {
          quat.copy(
            this.dragStartEntityRotation,
            this.selectedEntity.transform.localRotationQuat,
          );
        }
        this.setDragStartPoint();
      }

      if (this.isDragging) {
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
      this.activeHandle = null;
      this.isDragging = false;
    }
  }

  private setDragStartPoint() {
    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    if (this.activeHandle === 'translateXY') {
      vec3.set(this._planeNormal, 0, 0, 1);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.forward);
    } else if (this.activeHandle === 'translateXZ') {
      vec3.set(this._planeNormal, 0, 1, 0);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.up);
    } else if (this.activeHandle === 'translateYZ') {
      vec3.set(this._planeNormal, 1, 0, 0);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.right);
    } else {
      vec3.sub(
        this._planeNormal,
        camera.transform.worldPosition,
        this.selectedEntity.transform.worldPosition,
      );
      vec3.normalize(this._planeNormal, this._planeNormal);
    }

    const intersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      ray,
      this.selectedEntity.transform.worldPosition,
      this._planeNormal,
    );
    if (intersection) {
      vec3.copy(this.dragStartPoint, intersection);
    }
  }

  private drawPickingGizmo(gizmoTransform: mat4): number {
    switch (this.gizmoMode) {
      case GizmoMode.Translate:
        const pSize = this.gizmoSize * 0.25;
        const offset = this.gizmoSize * 0.2;

        // --- 1D Arrows Picking ---
        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          this.gizmoSize,
          0,
          0,
        ]);
        mat4.rotateZ(this._tempMatrix1, this._tempMatrix1, -Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          this.gizmoScale,
          this.gizmoScale,
          this.gizmoScale,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_X);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_X / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.coneHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          0,
          this.gizmoSize,
          0,
        ]);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          this.gizmoScale,
          this.gizmoScale,
          this.gizmoScale,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_Y / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.coneHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          0,
          0,
          this.gizmoSize,
        ]);
        mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          this.gizmoScale,
          this.gizmoScale,
          this.gizmoScale,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_Z / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.coneHelper.draw(this.pickingShader);

        // --- 2D Solid Planes Picking ---
        this._gl.disable(this._gl.CULL_FACE);

        // XY Plane
        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          offset,
          offset,
          0,
        ]);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_XY);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_XY / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.planeHelper.drawSolid(this.pickingShader);

        // XZ Plane
        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          offset,
          0,
          offset,
        ]);
        mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_XZ);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_XZ / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.planeHelper.drawSolid(this.pickingShader);

        // YZ Plane
        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          0,
          offset,
          offset,
        ]);
        mat4.rotateY(this._tempMatrix1, this._tempMatrix1, -Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [pSize, pSize, 1]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_TRANSLATE_YZ);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_TRANSLATE_YZ / 255,
          0,
          0,
          1.0,
        );
        this.pickingShader.loadDataIntoShader();
        this.planeHelper.drawSolid(this.pickingShader);

        this._gl.enable(this._gl.CULL_FACE);
        break;

      // Replace the Scale block inside drawPickingGizmo()
      case GizmoMode.Scale:
        const sSize = this.gizmoSize * 0.25; // Fatter scale for foolproof picking

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          this.gizmoSize,
          0,
          0,
        ]);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [sSize, sSize, sSize]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_X);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_SCALE_X / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.scaleBoxHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          0,
          this.gizmoSize,
          0,
        ]);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [sSize, sSize, sSize]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_SCALE_Y / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.scaleBoxHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.translate(this._tempMatrix1, this._tempMatrix1, [
          0,
          0,
          this.gizmoSize,
        ]);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [sSize, sSize, sSize]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_SCALE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_SCALE_Z / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.scaleBoxHelper.draw(this.pickingShader);
        break;

      case GizmoMode.Rotate:
        const gizmoSize = this.gizmoSize * 1.2;

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.rotateY(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          gizmoSize,
          gizmoSize,
          gizmoSize,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_X);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_ROTATE_X / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.pickingTorusHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.rotateX(this._tempMatrix1, this._tempMatrix1, Math.PI / 2);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          gizmoSize,
          gizmoSize,
          gizmoSize,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Y);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_ROTATE_Y / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.pickingTorusHelper.draw(this.pickingShader);

        mat4.copy(this._tempMatrix1, gizmoTransform);
        mat4.scale(this._tempMatrix1, this._tempMatrix1, [
          gizmoSize,
          gizmoSize,
          gizmoSize,
        ]);
        this.setMatrices(
          this.selectedEntity.transform,
          this._tempMatrix1,
          this.pickingShader,
        );
        this.pickingShader.setFloat('u_entity_id', this.HANDLE_ID_ROTATE_Z);
        (this.pickingShader.material as ColorMaterial).color.set(
          this.HANDLE_ID_ROTATE_Z / 255,
          0,
          0,
          1,
        );
        this.pickingShader.loadDataIntoShader();
        this.pickingTorusHelper.draw(this.pickingShader);
        break;
    }

    this._gl.readPixels(
      Mouse.mousePosition.x,
      this.pickingTexture.height - Mouse.mousePosition.y,
      1,
      1,
      this._gl.RGBA,
      this._gl.UNSIGNED_BYTE,
      this._pickingPixel,
    );
    return this._pickingPixel[0];
  }

  private dragTranslateEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    let isPlanar = false;

    if (this.activeHandle === 'translateXY') {
      isPlanar = true;
      vec3.set(this._planeNormal, 0, 0, 1);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.forward);
    } else if (this.activeHandle === 'translateXZ') {
      isPlanar = true;
      vec3.set(this._planeNormal, 0, 1, 0);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.up);
    } else if (this.activeHandle === 'translateYZ') {
      isPlanar = true;
      vec3.set(this._planeNormal, 1, 0, 0);
      if (this.transformSpace === TransformSpace.Local)
        vec3.copy(this._planeNormal, this.selectedEntity.transform.right);
    }

    if (isPlanar) {
      const intersection = Raycast.intersectRayWithPlane(
        camera.transform.worldPosition,
        ray,
        this.dragStartPoint,
        this._planeNormal,
      );
      if (intersection) {
        vec3.sub(this._moveVector, intersection, this.dragStartPoint);
        vec3.add(
          this._newPosition,
          this.dragStartEntityPosition,
          this._moveVector,
        );
        this.selectedEntity.transform.setWorldPosition(
          this._newPosition[0],
          this._newPosition[1],
          this._newPosition[2],
        );
        this.selectedEntity.transform.updateMatrices();
      }
      return;
    }

    if (this.transformSpace === TransformSpace.World) {
      if (this.activeHandle === 'translateX') vec3.set(this._moveAxis, 1, 0, 0);
      if (this.activeHandle === 'translateY') vec3.set(this._moveAxis, 0, 1, 0);
      if (this.activeHandle === 'translateZ') vec3.set(this._moveAxis, 0, 0, 1);
    } else {
      if (this.activeHandle === 'translateX')
        vec3.copy(this._moveAxis, this.selectedEntity.transform.right);
      if (this.activeHandle === 'translateY')
        vec3.copy(this._moveAxis, this.selectedEntity.transform.up);
      if (this.activeHandle === 'translateZ')
        vec3.copy(this._moveAxis, this.selectedEntity.transform.forward);
    }

    vec3.copy(this._planeNormal, camera.transform.forward);
    const intersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      ray,
      this.dragStartPoint,
      this._planeNormal,
    );

    if (intersection) {
      vec3.sub(this._moveVector, intersection, this.dragStartPoint);
      const projectedLength = vec3.dot(this._moveVector, this._moveAxis);
      vec3.scaleAndAdd(
        this._newPosition,
        this.dragStartEntityPosition,
        this._moveAxis,
        projectedLength,
      );
      this.selectedEntity.transform.setWorldPosition(
        this._newPosition[0],
        this._newPosition[1],
        this._newPosition[2],
      );
      this.selectedEntity.transform.updateMatrices();
    }
  }

  private dragScaleEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });

    vec3.set(this._scaleAxis, 0, 0, 0);
    if (this.activeHandle === 'scaleX') vec3.set(this._scaleAxis, 1, 0, 0);
    if (this.activeHandle === 'scaleY') vec3.set(this._scaleAxis, 0, 1, 0);
    if (this.activeHandle === 'scaleZ') vec3.set(this._scaleAxis, 0, 0, 1);

    vec3.copy(this._planeNormal, camera.transform.forward);
    const intersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      ray,
      this.dragStartPoint,
      this._planeNormal,
    );

    if (intersection) {
      vec3.sub(this._moveVector, intersection, this.dragStartPoint);
      const dragAmount = vec3.dot(this._moveVector, this._scaleAxis);

      // Prevent negative scaling or instant collapse to zero
      const scaleFactor = Math.max(1.0 + dragAmount * 0.25, 0.001);

      vec3.copy(this._newScale, this.dragStartEntityScale);

      if (this.activeHandle === 'scaleX')
        this._newScale[0] = this.dragStartEntityScale[0] * scaleFactor;
      if (this.activeHandle === 'scaleY')
        this._newScale[1] = this.dragStartEntityScale[1] * scaleFactor;
      if (this.activeHandle === 'scaleZ')
        this._newScale[2] = this.dragStartEntityScale[2] * scaleFactor;

      this.selectedEntity.transform.setLocalScale(
        this._newScale[0],
        this._newScale[1],
        this._newScale[2],
      );
    }
  }

  private dragRotateEntity() {
    if (!this.activeHandle || !this.selectedEntity) return;

    const camera = Camera.mainCamera;
    const ray = Raycast.screenPointToRay(camera, { webgl: this._gl });
    const entityPosition = this.selectedEntity.transform.worldPosition;

    // Unskewed local base unit vectors
    const localX = vec3.fromValues(1, 0, 0);
    const localY = vec3.fromValues(0, 1, 0);
    const localZ = vec3.fromValues(0, 0, 1);

    // 1. Determine rotation axis based on immutable unit vectors mapped to orientation space
    if (this.transformSpace === TransformSpace.World) {
      if (this.activeHandle === 'rotateX') {
        vec3.set(this._planeNormal, 1, 0, 0);
        vec3.set(this._rotationAxis, 1, 0, 0);
      } else if (this.activeHandle === 'rotateY') {
        vec3.set(this._planeNormal, 0, 1, 0);
        vec3.set(this._rotationAxis, 0, 1, 0);
      } else if (this.activeHandle === 'rotateZ') {
        vec3.set(this._planeNormal, 0, 0, 1);
        vec3.set(this._rotationAxis, 0, 0, 1);
      }
    } else {
      // Local space uses absolute unskewed base vectors rotated by absolute entity orientation
      const rot = this.selectedEntity.transform.worldRotationQuat;
      if (this.activeHandle === 'rotateX') {
        vec3.transformQuat(this._planeNormal, localX, rot);
        vec3.transformQuat(this._rotationAxis, localX, rot);
      } else if (this.activeHandle === 'rotateY') {
        vec3.transformQuat(this._planeNormal, localY, rot);
        vec3.transformQuat(this._rotationAxis, localY, rot);
      } else if (this.activeHandle === 'rotateZ') {
        vec3.transformQuat(this._planeNormal, localZ, rot);
        vec3.transformQuat(this._rotationAxis, localZ, rot);
      }
    }

    vec3.normalize(this._planeNormal, this._planeNormal);
    vec3.normalize(this._rotationAxis, this._rotationAxis);

    const lastRay = Raycast.screenPointToRay(
      camera,
      { webgl: this._gl },
      this.lastMousePosition,
    );

    const lastIntersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      lastRay,
      entityPosition,
      this._planeNormal,
    );
    const currentIntersection = Raycast.intersectRayWithPlane(
      camera.transform.worldPosition,
      ray,
      entityPosition,
      this._planeNormal,
    );

    if (currentIntersection && lastIntersection) {
      vec3.sub(this._lastVector, lastIntersection, entityPosition);
      vec3.sub(this._currentVector, currentIntersection, entityPosition);

      if (
        vec3.length(this._lastVector) < 0.001 ||
        vec3.length(this._currentVector) < 0.001
      )
        return;

      vec3.normalize(this._lastVector, this._lastVector);
      vec3.normalize(this._currentVector, this._currentVector);

      let angle = vec3.angle(this._lastVector, this._currentVector);

      vec3.cross(this._crossProduct, this._lastVector, this._currentVector);
      if (vec3.dot(this._planeNormal, this._crossProduct) < 0) {
        angle = -angle;
      }

      quat.setAxisAngle(this._deltaRotation, this._rotationAxis, angle);
      const currentRotation = this.selectedEntity.transform.localRotationQuat;

      // Concatenate local rotation cleanly
      if (this.transformSpace === TransformSpace.World) {
        quat.multiply(this._newRotation, this._deltaRotation, currentRotation);
      } else {
        quat.multiply(this._newRotation, currentRotation, this._deltaRotation);
      }

      quat.normalize(this._newRotation, this._newRotation);

      this.selectedEntity.transform.setLocalRotationQuat(this._newRotation);
      this.selectedEntity.transform.updateMatrices();
    }
  }
  protected override setCameraMatrices(): void {}

  setMatrices(
    transform: Transform,
    modelMatrix?: mat4,
    shader: Shader = this.shader!,
  ) {
    if (shader) {
      shader.use();
      const matrix = modelMatrix ? modelMatrix : transform.modelMatrix;

      shader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, matrix);
      shader.setMat4('u_worldMatrix', matrix);
    }
  }

  drawBoundingBox(boundingBox: BoundingBox, spacing = 0.1) {
    const { min_x, min_y, min_z, max_x, max_y, max_z } = boundingBox;

    this._bbTopLeftFar.x = min_x - spacing;
    this._bbTopLeftFar.y = max_y + spacing;
    this._bbTopLeftFar.z = min_z - spacing;
    this._bbTopLeftNear.x = min_x - spacing;
    this._bbTopLeftNear.y = max_y + spacing;
    this._bbTopLeftNear.z = max_z + spacing;
    this._bbBottomLeftFar.x = min_x - spacing;
    this._bbBottomLeftFar.y = min_y - spacing;
    this._bbBottomLeftFar.z = min_z - spacing;
    this._bbBottomLeftNear.x = min_x - spacing;
    this._bbBottomLeftNear.y = min_y - spacing;
    this._bbBottomLeftNear.z = max_z + spacing;

    this.drawLine(this._bbTopLeftFar, this._bbTopLeftNear);
    this.drawLine(this._bbBottomLeftFar, this._bbBottomLeftNear);
    this.drawLine(this._bbTopLeftFar, this._bbBottomLeftFar);
    this.drawLine(this._bbTopLeftNear, this._bbBottomLeftNear);

    this._bbTopRightFar.x = max_x + spacing;
    this._bbTopRightFar.y = max_y + spacing;
    this._bbTopRightFar.z = min_z - spacing;
    this._bbTopRightNear.x = max_x + spacing;
    this._bbTopRightNear.y = max_y + spacing;
    this._bbTopRightNear.z = max_z + spacing;
    this._bbBottomRightFar.x = max_x + spacing;
    this._bbBottomRightFar.y = min_y - spacing;
    this._bbBottomRightFar.z = min_z - spacing;
    this._bbBottomRightNear.x = max_x;
    this._bbBottomRightNear.y = min_y - spacing;
    this._bbBottomRightNear.z = max_z + spacing;

    this.drawLine(this._bbTopRightFar, this._bbTopRightNear);
    this.drawLine(this._bbBottomRightFar, this._bbBottomRightNear);
    this.drawLine(this._bbTopRightFar, this._bbBottomRightFar);
    this.drawLine(this._bbTopRightNear, this._bbBottomRightNear);

    this.drawLine(this._bbTopLeftFar, this._bbTopRightFar);
    this.drawLine(this._bbTopLeftNear, this._bbTopRightNear);
    this.drawLine(this._bbBottomLeftFar, this._bbBottomRightFar);
    this.drawLine(this._bbBottomLeftNear, this._bbBottomRightNear);
  }

  private refreshTexture() {
    if (
      this.pickingTexture.width !== CanvasViewport.rendererWidth ||
      this.pickingTexture.height !== CanvasViewport.rendererHeight
    ) {
      this.pickingTexture.destroy();
      this.pickingTexture = Texture.create(
        this._gl,
        CanvasViewport.rendererWidth,
        CanvasViewport.rendererHeight,
        null,
      );
    }
  }
}
