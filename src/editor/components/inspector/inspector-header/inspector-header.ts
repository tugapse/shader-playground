import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { SceneTreeService } from '@editor/services/scene-tree.service';
import { GlEntity } from 'omega-game-engine';
import { Icon } from 'src/app/components/icon/icon';
import { Toggle } from "src/app/components/toggle/toggle";

@Component({
  selector: 'editor-inspector-header',
  imports: [CommonModule, Icon, Toggle],
  templateUrl: './inspector-header.html',
  styleUrl: './inspector-header.scss'
})
export class InspectorHeader {

  @Input() entity!: GlEntity | null;
  @Input() windowTitle ="Inspector";


  constructor(private readonly editorService: EditorService,
    private readonly sceneTreeService: SceneTreeService) { }

  onClose() {
    this.sceneTreeService.onEntitySelected.emit();
    this.editorService.onEditorSaveStateRequest.emit();
    setTimeout(() => this.editorService.requestCanvasResize(), 30);
  }
}
