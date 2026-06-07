import { EventEmitter, Injectable } from "@angular/core";
import { GlEntity, Scene } from "@engine";

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<GlEntity>();
  public onSceneUpdated = new EventEmitter<Scene>();

}
