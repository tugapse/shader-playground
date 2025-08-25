import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SceneTreeService } from '@editor/components/scene-tree/scene-tree.service';
import { EditorService } from '@editor/editor.service';
import { GlEntity } from '@engine/entities';
import { Icon } from 'src/app/components/icon/icon';

@Component({
  selector: 'editor-inspector-header',
  imports: [CommonModule, Icon],
  templateUrl: './inspector-header.html',
  styleUrl: './inspector-header.scss'
})
export class InspectorHeader {

  @Input() entity!: GlEntity | null;

  constructor(private readonly editorService: EditorService,
    private readonly sceneTreeService: SceneTreeService) { }

  onClose() {
    this.sceneTreeService.onEntitySelected.emit();
    setTimeout(() => this.editorService.requestCanvasResize(), 30);
  }
}
