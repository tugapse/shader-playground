import { EventEmitter, Injectable } from "@angular/core";
import { GlEntity } from "omega-game-engine";

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<GlEntity>();

}
