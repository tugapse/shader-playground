import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Toggle } from "src/app/components/toggle/toggle";

@Component({
  selector: 'app-boolean-inspector',
  imports: [Toggle],
  templateUrl: './boolean-inspector.html',
  styleUrl: './boolean-inspector.scss'
})
export class BooleanInspector {

  @Input() active: boolean = false;
  @Input() label: string = "";
  @Output() change: EventEmitter<boolean> = new EventEmitter();
}
