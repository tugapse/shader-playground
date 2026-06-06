import { EventEmitter, Injectable } from "@angular/core";
import { GlEntity, Scene } from "@engine";

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<GlEntity>();
  public onAddNewRequested = new EventEmitter();
  public onSceneUpdated = new EventEmitter<Scene>();

}
