import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BooleanInspector } from '@editor/components/inspector-components/boolean-inspector/boolean-inspector';
import { TextInputInspector } from '@editor/components/inspector-components/text-input-inspector/text-input-inspector';
import { VectorInspector } from '@editor/components/inspector-components/vector-inspector/vector-inspector';
import { Color, NumberRange, Vector2, Vector3, Vector4 } from '@engine';
import { DropdownItem } from 'src/app/components/dropdown/dropdown';
import { ColorInspector } from '../color-inspector/color-inspector';
import { EnumInspector } from '../enum-inspector/enum-inspector';
import { NumberRangeInspector } from '../../components/inspector-components/number-range-inspector/number-range-inspector';
import {
  ITargetObject,
  ITargetProperty,
} from '../object-inspector/object-inspector';

@Component({
  selector: 'editor-default-inspector',
  imports: [
    TextInputInspector,
    BooleanInspector,
    ColorInspector,
    VectorInspector,
    EnumInspector,
    NumberRangeInspector,
  ],
  templateUrl: './default-inspector.html',
  styleUrl: './default-inspector.scss',
})
export class DefaultInspector {
  @Input() item!: ITargetProperty;
  @Output() change = new EventEmitter<
    string | number | boolean | NumberRange | Color 
  >();

  private _onPropertyChanged(propertyKey: string, value: any): void {
    if (value instanceof Event) return;
    this.item.value = value;
    this.change.emit(value);
  }

  onValueChanged(
    property: ITargetObject,
    value: string | number | boolean | NumberRange,
  ): void {
    this._onPropertyChanged(property.key, value);
  }

  onVectorChanged(
    property: ITargetObject,
    value: Vector4 | Vector3 | Vector2,
  ): void {
    this._onPropertyChanged(property.key, value);
  }

  onColorChanged(property: ITargetObject, value: Color): void {
    this._onPropertyChanged(property.key, value);
  }

  protected onEnumChange(key: string, menuItem: DropdownItem) {
   this._onPropertyChanged(key, menuItem.value);
  }

  protected onRangeChange(item: ITargetProperty, $event: NumberRange) {
    this._onPropertyChanged(item.key, $event.value);
  }
}
