import { EventEmitter, Injectable } from "@angular/core";
import { Scene } from "@engine/entities/scene";

@Injectable({ providedIn: 'root' })
export class EditorService {

  onSceneLoaded = new EventEmitter<Scene>();
  onScenePlay = new EventEmitter<Scene>();
  onScenePause = new EventEmitter<Scene>();
  onSceneStop = new EventEmitter<Scene>();

  onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();
  onCanvasRequestResize = new EventEmitter();



  loadScene(scene: Scene) {
    this.onSceneLoaded.emit(scene);
  }

  requestCanvasResize(){
    this.onCanvasRequestResize.emit();
  }

  requestScenePlay(scene?: Scene){
    this.onScenePlay.emit(scene);
  }

  requestScenePause(scene?: Scene){
    this.onScenePause.emit(scene);
  }

  requestSceneStop(scene?: Scene){
    this.onSceneStop.emit(scene);
  }


}
