import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DropdownComponent,
  DropdownItem,
} from 'src/app/components/dropdown/dropdown';
@Component({
  selector: 'editor-enum-inspector',
  imports: [DropdownComponent],
  templateUrl: './enum-inspector.html',
  styleUrl: './enum-inspector.scss',
})
export class EnumInspector {
  @Input({ required: true }) label: string = '';
  @Input() items: DropdownItem[] = [];
  @Input() set selected(value:number){
    
    this._selected = this.items.find(e=> +e.value == value) || this.items[0];
  };
  
  _selected!: DropdownItem;
  @Output() change = new EventEmitter<DropdownItem>();

}
