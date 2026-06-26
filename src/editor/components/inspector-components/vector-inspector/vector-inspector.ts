import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TextInputInspector } from '../text-input-inspector/text-input-inspector';
import { Vector4, Vector3, Vector2 } from '@engine';
import { EditorVectorGizmoComponent } from './component/vector-gizmo';
import { Icon } from "src/app/components/icon/icon";

@Component({
  selector: 'editor-vector-inspector',
  imports: [TextInputInspector, EditorVectorGizmoComponent, Icon],
  templateUrl: './vector-inspector.html',
  styleUrl: './vector-inspector.scss',
})
export class VectorInspector {
  isGizmoMode: boolean = false;
  showGizmo: boolean = false;

  @Input() vectorKeys = ['x', 'y', 'z', 'w'];
  @Input() vector!: Vector4 | Vector3 | Vector2;
  @Input() label: string = 'No title';
  @Input() scale: number = 0.1;
  @Output() vectorChanged = new EventEmitter<Vector4 | Vector3 | Vector2>();

  onGizmoChanged($event: { index: number; value: any }) {
    if ($event.value instanceof Event) return;

    this.vector.vector[$event.index] = $event.value;
    this.vectorChanged.emit(this.vector);
  }

  onVectorChanged(index: number, value: any) {
    if (value instanceof Event) return;
    this.vector.vector[index] = +(+value).toFixed(3);
    debugger;
    this.vectorChanged.emit(this.vector);
  }
}
