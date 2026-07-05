import { EventEmitter, Injectable } from '@angular/core';
import { SceneEntity, Scene } from '@engine';

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<SceneEntity>();
}
