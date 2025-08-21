import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Scene } from '@engine/entities/scene';
import { Icon } from "../icon/icon";
import { LightType } from '@engine/enums/light-type.enum';
import { Light } from '@engine/entities/light';
import { GlEntity } from '@engine/entities/entity';
import { SceneTreeService } from './scene-tree.service';

@Component({
  selector: 'app-scene-tree',
  imports: [CommonModule, Icon],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss'
})
export class SceneTree {

  constructor(public sceneTreeService: SceneTreeService) { }


  @Input() public targetScene?: Scene;
  readonly iconNames = {
    [LightType.AMBIENT]: "fa-circle-half-stroke",
    [LightType.DIRECTIONAL]: "fa-sun",
    [LightType.POINT]: "fa-lightbulb",
    [LightType.SPOT]: "fa-traffic-light",
  }

  toggleLight(light: Light) {
    light.active = !light.active;
  }

  toggleObj(obj: GlEntity) {
    obj.active = !obj.active;
  }

}
