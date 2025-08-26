import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  imports: [],
  templateUrl: './toggle.html',
  styleUrl: './toggle.scss'
})
export class Toggle {
  @Output() change = new EventEmitter<boolean>();
  @Input() active = false;
}
