import { Component, Input } from '@angular/core';
import { EntityInspector } from '../inpector.editor';
import { GlEntity } from '@engine/entities/entity';
import { Transform } from '@engine/core/transform';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'editor-transform-inspector',
  imports: [CommonModule],
  templateUrl: './transform-inspector.html',
  styleUrl: './transform-inspector.scss'
})
export class TransformInspector {

  transform!: Transform;

  @Input() set targetEntity(value: GlEntity) {
    this.transform = value.transform;
  }

  onPositionChanged(index: number, event: Event) {
    const value = this.transform.position;
    value[index] = (event.target as any).value;
    this.transform.setPosition(...value);
  }

  onRotationChanged(index: number, event: Event) {
    const value = this.transform.rotation;
    value[index] = (event.target as any).value;
    this.transform.setRotation(...value);
  }

  onScaleChanged(index: number, event: Event) {
    const value = this.transform.localScale;
    value[index] = (event.target as any).value;
    this.transform.setScale(...value);
  }
}
