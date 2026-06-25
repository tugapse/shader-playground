import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TextInputInspector } from "../text-input-inspector/text-input-inspector";
import { Vector4, Vector3, Vector2 } from '@engine';

@Component({
  selector: 'editor-vector-inspector',
  imports: [TextInputInspector],
  templateUrl: './vector-inspector.html',
  styleUrl: './vector-inspector.scss'
})
export class VectorInspector {

  @Input() vectorKeys = ["x", "y", "z", "w"];
  @Input() vector!: Vector4 | Vector3 | Vector2;
  @Input() label: string = "No title";
  @Input() scale: number = 0.1;
  @Output() vectorChanged = new EventEmitter<Vector4 | Vector3 | Vector2>()

  onVectorChanged(index: number, value:string|number) {
    this.vector.vector[index] = +(+value).toFixed(3) ;
    this.vectorChanged.emit(this.vector);
  }
}
