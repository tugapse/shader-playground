import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Scene } from '@engine/entities/scene';
import { Icon } from "../icon/icon";
import { LightType } from '@engine/enums/light-type.enum';
import { Light } from '@engine/entities/light';

@Component({
  selector: 'app-scene-tree',
  imports: [CommonModule, Icon],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss'
})
export class SceneTree {

  @Input() public targetScene?: Scene;
  readonly iconNames = {
    [LightType.AMBIENT]: "fa-circle-half-stroke",
    [LightType.DIRECTIONAL]: "fa-sun",
    [LightType.POINT]: "fa-lightbulb",
    [LightType.SPOT]: "fa-traffic-light",
  }

  toggleLight(light:Light){
    light.active = !light.active;
  }

}
