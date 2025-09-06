import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ITargetObject, ITargetProperty, ObjectInspector } from '../object-inspector/object-inspector';
import { DropdownComponent, DropdownItem } from "src/app/components/dropdown/dropdown";

@Component({
  selector: 'editor-enum-inspector',
  imports: [DropdownComponent],
  templateUrl: './enum-inspector.html',
  styleUrl: './enum-inspector.scss'
})
export class EnumInspector {

  @Input({ required: true }) label: string = "";
  @Input() selected!: DropdownItem;
  @Input() items: DropdownItem[] = [];

  @Output() change = new EventEmitter<DropdownItem>()

}
