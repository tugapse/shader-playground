import { EventEmitter, Injectable } from "@angular/core";
import { GlEntity } from "@engine/entities/entity";

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<GlEntity>();

}
