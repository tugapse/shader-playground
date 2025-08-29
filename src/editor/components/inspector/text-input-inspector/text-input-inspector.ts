import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { DragEventData, DragHandleDirective } from '@editor/directives/mouse-drag.directive';

@Component({
  selector: 'editor-text-input-inspector',
  imports: [DragHandleDirective],
  templateUrl: './text-input-inspector.html',
  styleUrl: './text-input-inspector.scss'
})
export class TextInputInspector {


  @Input() label!: string;
  @Input() value!: string | number;
  @Input() isNumber = false;
  @Input() dragScale = 1.0;

  @Output() change = new EventEmitter<string | number>();

  onChange($event: Event) {
    const newValue = ($event.target as any).value;
    this.value = this.isNumber ? Number(newValue) : newValue;
    this.change.emit(this.value);
  }

  onDrag($event: DragEventData) {
    if (this.isNumber) {
      const newValue = ($event.deltaX * this.dragScale) + (+this.value || 0);
      this.value = newValue as number;
      this.change.emit(this.value);
    }
  }
}
