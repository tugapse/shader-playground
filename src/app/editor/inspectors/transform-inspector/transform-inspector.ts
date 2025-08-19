import { Component, Input } from '@angular/core';
import { EntityInspector } from '../inpector.editor';
import { GlEntity } from '@engine/entities/entity';

@Component({
  selector: 'app-transform-inspector',
  imports: [],
  templateUrl: './transform-inspector.html',
  styleUrl: './transform-inspector.scss'
})
export class TransformInspector {
  @Input() set targetEntity(value: GlEntity) {
    this._inspector.setTarget(value);
  }
   _inspector: EntityInspector = new EntityInspector();

}
