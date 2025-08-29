import { EventEmitter, Injectable } from "@angular/core";
import { Camera } from "@engine/entities/camera";
import { Scene } from "@engine/entities/scene";
import { vec3 } from "gl-matrix";
import { EditorCameraBehaviour } from "./behaviours/editor.camera";

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

  private camera!: Camera;
  constructor() {
    this.initializeEditorCamera();
  }

  loadScene(scene: Scene) {
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


  protected initializeEditorCamera(){
    this.camera = new Camera();
    this.camera.name = "Editor Camera"
    this.camera.updateInEditor = true;
    Camera.setMainCamera(this.camera);
    Camera.mainCamera.addBehaviour(new EditorCameraBehaviour());
    this.camera.initialize();
    this.camera.update(1);
    this.camera.transform.translate(2,3,10);
  }


}
