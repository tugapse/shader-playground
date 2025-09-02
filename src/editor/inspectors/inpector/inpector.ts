import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MovableDirective } from '@editor/directives/moveable.directive';
import { EditorService } from '@editor/editor.service';
import { Icon } from "src/app/components/icon/icon";
import { InspectorHeader } from '../../components/inspector/inspector-header/inspector-header';
import { EntityInspector } from "../entity-inspector/entity-inspector";
import { GlEntity } from 'omega-game-engine';

@Component({
  selector: 'editor-inpector',
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss',
  imports: [
    CommonModule, InspectorHeader, MovableDirective,
    Icon,
    EntityInspector
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
  }

}
