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
  onSceneUpdated = new EventEmitter<Scene>();



  onEditorSaveStateRequest = new EventEmitter();

  editorRunningState = new EventEmitter<boolean>();

  onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();
  onCanvasRequestResize = new EventEmitter();
  onCanvasRequestReset = new EventEmitter();

  onRenderFrame = new BehaviorSubject<WebGL2RenderingContext | null>(null);
  onUpdateFrame = new BehaviorSubject<number>(0);

  public gizmoMode = new BehaviorSubject<GizmoMode>(GizmoMode.Translate);
  public transformSpace = new BehaviorSubject<TransformSpace>(TransformSpace.World);
  private _gl!: WebGL2RenderingContext;
  
  public get scene(): Scene {
    return this.currentScene;
  }
  
  public get camera(): Camera {
    return this._camera;
  }

  public get gl(): WebGL2RenderingContext {
    return this._gl;
  }
  
  private currentScene!: Scene;
  private _camera!: Camera;
  constructor() {
    this.initializeEditorCamera();
    this.onRenderingContextCreated.subscribe(this.onGlContextCreated.bind(this));

  }

  onGlContextCreated(gl: WebGL2RenderingContext) {
    console.log("onGlContextCreated");  
    this._gl = gl;
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
    this._camera = new Camera();
    this._camera.name = "Editor Camera"
    this._camera.fieldOfView = 65;
    this._camera.transform.translate(2, 3, 10);
    this._camera.transform.rotate(0, 180, 0);
    this._camera.initialize();
    this._camera.addBehaviour(new CameraFlyBehaviour())
    Camera.setMainCamera(this._camera);
    this._camera.updateInEditor = true;
  }


}
