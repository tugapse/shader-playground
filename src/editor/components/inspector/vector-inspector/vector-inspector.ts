import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TextInputInspector } from "../text-input-inspector/text-input-inspector";
import { Vector4, Vector3, Vector2 } from 'omega-game-engine';

@Component({
  selector: 'editor-vector-inspector',
  imports: [TextInputInspector],
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
