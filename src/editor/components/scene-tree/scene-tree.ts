import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Scene } from '@engine/entities/scene';
import { Icon } from "../../../app/components/icon/icon";
import { Light } from '@engine/entities/light';
import { GlEntity } from '@engine/entities/entity';
import { SceneTreeService } from './scene-tree.service';
import { EntityType } from '@engine/enums/entity-type';
import { every } from 'rxjs';
import { EditorService } from '../../editor.service';


@Component({
  selector: 'app-scene-tree',
  imports: [CommonModule, Icon],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss'
})
export class SceneTree {


  constructor(public sceneTreeService: SceneTreeService, private editorService: EditorService) {
    this.editorService.onSceneLoaded.subscribe(scene => {
      this.targetScene = scene;
      this.sceneTreeService.onEntitySelected.emit(undefined);
    })
  }


  @Input() public set targetScene(scene: Scene) {
    this.scene = scene;
    this.prepareObjects();
  };
  objectsToDraw: GlEntity[] = []
  scene!: Scene;
  readonly iconNames: { [key: string]: string } = {
    [EntityType.STATIC]: "fa-object-group",
    [EntityType.CAMERA]: "fa-camera",
    [EntityType.LIGHT_AMBIENT]: "fa-circle-half-stroke",
    [EntityType.LIGHT_DIRECTIONAL]: "fa-sun",
    [EntityType.LIGHT_POINT]: "fa-lightbulb",
    [EntityType.LIGHT_SPOT]: "fa-traffic-light",
  }

  toggleObj(obj: GlEntity, event: Event) {
    event.preventDefault();
    obj.show = !obj.show;
  }

  entitySelected(entity: GlEntity, event: MouseEvent) {
    if (entity.uuid == (event.target! as any).id) {
      this.sceneTreeService.onEntitySelected.emit(entity);
      setTimeout(()=>this.editorService.requestCanvasResize(),30);
    }
  }

  prepareObjects() {
    if (!this.scene) return;
    const objectsDict = this.scene.objects.reduce((acc, curr) => { return { ...acc, [curr.uuid]: curr } }, {});
    const rootObjects = this.scene.objects;
    this.objectsToDraw = rootObjects;
  }
}
