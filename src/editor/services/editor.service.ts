import { EventEmitter, Injectable } from "@angular/core";
import { vec3 } from "gl-matrix";
import { Camera, CameraFlyBehaviour, CameraType, Scene } from "@engine";
import { BehaviorSubject } from "rxjs";
import { GizmoMode } from "../behaviours/scene-editor/gizmo-mode.enum";
import { TransformSpace } from "../behaviours/scene-editor/transform-space.enum";


@Injectable({ providedIn: 'root' })
export class EditorService {

  onSceneLoaded = new EventEmitter<Scene>();
  onScenePlay = new EventEmitter<Scene>();
  onScenePause = new EventEmitter<Scene>();
  onSceneStop = new EventEmitter<Scene>();
  onEditorSaveStateRequest = new EventEmitter();

  editorRunningState = new EventEmitter<boolean>();

  onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();
  onCanvasRequestResize = new EventEmitter();
  onCanvasRequestReset = new EventEmitter();

  onRenderFrame = new BehaviorSubject<WebGL2RenderingContext | null>(null);
  onUpdateFrame = new BehaviorSubject<number>(0);

  public gizmoMode = new BehaviorSubject<GizmoMode>(GizmoMode.Translate);
  public transformSpace = new BehaviorSubject<TransformSpace>(TransformSpace.World);
  public get scene(): Scene {
    return this.currentScene;
  }

  
  private currentScene!: Scene;
  private camera!: Camera;
  constructor() {
    this.initializeEditorCamera();
  }
  


  loadScene(scene: Scene) {
    this.currentScene = scene;
    this.onSceneLoaded.emit(scene);
  }

  requestCanvasResize() {
    this.onCanvasRequestResize.emit();
  }

  requestScenePlay(scene?: Scene) {
    this.onScenePlay.emit(scene);
  }

  requestScenePause(scene?: Scene) {
    this.onScenePause.emit(scene);
  }

  requestSceneStop(scene?: Scene) {
    this.onSceneStop.emit(scene);
  }

  public setGizmoMode(mode: GizmoMode) {
    this.gizmoMode.next(mode);
  }

  public setTransformSpace(space: TransformSpace) {
    this.transformSpace.next(space);
  }


  protected initializeEditorCamera() {
    this.camera = new Camera();
    this.camera.name = "Editor Camera"
    this.camera.fieldOfView = 65;
    this.camera.transform.translate(2, 3, 10);
    this.camera.transform.rotate(0, 180, 0);
    this.camera.initialize();
    this.camera.addBehaviour(new CameraFlyBehaviour())
    Camera.setMainCamera(this.camera);
    this.camera.updateInEditor = true;
  }


}
