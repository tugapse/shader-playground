import { EventEmitter, Injectable } from '@angular/core';
import { SceneEntity, Scene } from 'omega-game-engine';

@Injectable({ providedIn: 'root' })
export class SceneTreeService {
  public onEntitySelected = new EventEmitter<SceneEntity>();
}
