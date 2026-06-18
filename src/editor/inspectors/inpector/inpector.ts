import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovableDirective } from '@editor/directives/moveable.directive';
import { Icon } from "src/app/components/icon/icon";
import { InspectorHeader } from '../../components/inspector/inspector-header/inspector-header';
import { EntityInspector } from "../entity-inspector/entity-inspector";
import { GlEntity } from '@engine';
import { EditorService } from '@editor/services/editor.service';
import { SandboxSliderComponent } from "../sandbox-slider.component";

@Component({
  selector: 'editor-inpector',
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss',
  imports: [
    CommonModule, InspectorHeader, MovableDirective,
    Icon,
    EntityInspector,
    SandboxSliderComponent
],
})
export class Inpector {

  objectsToshow: { key: string, type: string, property: any }[] = []

  @Input() targetEntity!: GlEntity;

  entity?: GlEntity | null;

  constructor(private editorService: EditorService) {
  }


  onClose() {
    this.entity = null;

    this.editorService.onEditorSaveStateRequest.emit(true);
    this.editorService.requestCanvasResize();
    this.editorService.onSceneUpdated.emit(this.editorService.scene)
  }

}
