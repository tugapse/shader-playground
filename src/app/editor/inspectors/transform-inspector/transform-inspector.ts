import { Component, Input } from '@angular/core';
import { EntityInspector } from '../inpector.editor';
import { GlEntity } from '@engine/entities/entity';
import { Transform } from '@engine/core/transform';

@Component({
  selector: 'editor-transform-inspector',
  imports: [],
  templateUrl: './transform-inspector.html',
  styleUrl: './transform-inspector.scss'
})
export class TransformInspector{

  transform!: Transform;

  @Input() set targetEntity(value: GlEntity) {
    this.transform = this.targetEntity.transform;
  }


}
