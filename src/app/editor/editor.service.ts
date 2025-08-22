import { EventEmitter, Injectable } from "@angular/core";
import { Scene } from "@engine/entities/scene";

@Injectable({ providedIn: 'root' })
export class EditorService {

  onSceneLoaded = new EventEmitter<Scene>();
  onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();

  loadScene(scene: Scene) {
    this.onSceneLoaded.emit(scene);
  }

}
