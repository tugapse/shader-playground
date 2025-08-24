import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';
import { Icon } from "../../../app/components/icon/icon";
import { TransformInspector } from "../transform-inspector/transform-inspector";
import { EditorService } from '@editor/editor.service';

@Component({
  selector: 'editor-inpector',
  imports: [CommonModule, Icon, TransformInspector],
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss'
})
export class Inpector {
  prepareProperties(entity:GlEntity) {
    if(entity){
      const onw = Object.keys(entity).filter(key => entity.hasOwnProperty(key));
      debugger;
    }
  }

  @Input() set targetEntity(entity: GlEntity) {
    this.prepareProperties(entity);
    this.entity = entity;
  };

  entity!: GlEntity|null;

  constructor(private editorService: EditorService) { }

  onNameChanged($event: any): void {
    this.entity!.name = $event.target.value;
  }

  onTagChanged($event: any): void {
    this.entity!.name = $event.target.value;
  }
  onClose() {
    this.entity = null;
    setTimeout(() => this.editorService.requestCanvasResize(), 30);
  }
}
