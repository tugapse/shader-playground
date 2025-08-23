import { EventEmitter, Injectable } from "@angular/core";
import { CameraFlyBehaviour } from "@engine/behaviours/camera-fly-behaviour";
import { Camera } from "@engine/entities/camera";
import { Scene } from "@engine/entities/scene";
import { vec3 } from "gl-matrix";

@Injectable({ providedIn: 'root' })
export class EditorService {

  onSceneLoaded = new EventEmitter<Scene>();
  onScenePlay = new EventEmitter<Scene>();
  onScenePause = new EventEmitter<Scene>();
  onSceneStop = new EventEmitter<Scene>();

  onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();
  onCanvasRequestResize = new EventEmitter();

  private camera!: Camera;
  constructor() {
    this.camera = new Camera();
    this.camera.name = "Editor Camera"
    this.camera.updateInEditor = true;
    this.camera.initialize();
    this.camera.transform.translate(0,0,10);
    this.camera.transform.lookAt(vec3.create());
    Camera.setMainCamera(this.camera);
    Camera.mainCamera.addBehaviour(new CameraFlyBehaviour());


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


}
