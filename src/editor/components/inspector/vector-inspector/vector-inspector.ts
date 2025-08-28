import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Vector2, Vector3, Vector4 } from '@engine/core/vector';

@Component({
  selector: 'editor-vector-inspector',
  imports: [],
  templateUrl: './vector-inspector.html',
  styleUrl: './vector-inspector.scss'
})
export class VectorInspector {

  @Input() vectorKeys = ["x", "y", "z", "w"];
  @Input() vector!: Vector4 | Vector3 | Vector2;
  @Output() vectorChanged = new EventEmitter<Vector4 | Vector3 | Vector2>()

  onVectorChanged(index: number, $event: Event) {
    this.vector.vector[index] = ($event.target as any).value;
    this.vectorChanged.emit(this.vector);
  }
}
