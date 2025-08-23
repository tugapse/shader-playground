import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';
import { Icon } from "../../../app/components/icon/icon";
import { TransformInspector } from "../transform-inspector/transform-inspector";

@Component({
  selector: 'editor-inpector',
  imports: [CommonModule, Icon, TransformInspector],
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss'
})
export class Inpector {


  @Input() targetEntity!: GlEntity | null;


  onNameChanged($event: any): void {
    this.targetEntity!.name = $event.target.value;
  }

  onTagChanged($event: any): void {
    this.targetEntity!.name = $event.target.value;
  }
}
