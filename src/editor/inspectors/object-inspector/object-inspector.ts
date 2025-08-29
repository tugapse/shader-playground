import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { TextInputInspector } from "../../components/inspector/text-input-inspector/text-input-inspector";
import { Toggle } from "src/app/components/toggle/toggle";
import { ColorInspector } from "../color-inspector/color-inspector";
import { VectorInspector } from "../../components/inspector/vector-inspector/vector-inspector";
import { Color } from '@engine/core';
import { Vector4, Vector3, Vector2 } from '@engine/core/vector';
import { EntityBehaviour } from '@engine/behaviours';
import { BooleanInspector } from "../../components/inspector/boolean-inspector/boolean-inspector";

export interface ITargetObject {
  [key: string]: any;
  key: string, type: string, property: any
}

export interface ITargetProperty {
  [key: string]: any;
  key: string, type: string, value: any
}


@Component({
  selector: 'editor-object-inspector',
  imports: [InpectorTogglePanel, TextInputInspector, ColorInspector, VectorInspector, BooleanInspector],
  templateUrl: './object-inspector.html',
  styleUrl: './object-inspector.scss'
})
export class ObjectInspector {


  @Input() allowProperties: string[] = [];
  @Input() denyProperties: string[] = [];
  @Input() title: string = "No title";

  @Input() set targetObject(value: ITargetObject) {
    this._selectedObject = value;
    this.loadProperties();
  }
  @Output() change = new EventEmitter();

  _selectedObject?: ITargetObject;
  _properties: any[] = [];


  onValueChanged(property: ITargetProperty, value: string | number | boolean) {
    if (!this._selectedObject) return;
    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
  }

  onVectorChanged(property: ITargetProperty, value: Vector4 | Vector3 | Vector2) {
    throw new Error('Method not implemented.');
  }

  onColorChanged(property: ITargetProperty, value: Color) {
    throw new Error('Method not implemented.');
  }



  protected loadProperties() {
    if (!this._selectedObject) return;

    this._properties = [];
    const object = this._selectedObject.property;
    const keys = Object.keys(object).filter(this.isPropertyValid.bind(this));
    for (const key of keys) {
      console.debug(key,)
      const newValue = (object)[key];
      this._properties.push({ key, type: typeof newValue, value: newValue });
      console.debug(typeof newValue);
    }
  }

  protected isPropertyValid(key: string) {
    if (this.allowProperties.length > 0) return this.allowProperties.includes(key);
    if (this.denyProperties.length > 0) return this.denyProperties.includes(key) == false;
    return key.startsWith("_") == false;
  }


  protected isValidPropertyType(key: string): boolean {
    if (!this._selectedObject) return false;

    const value = this._selectedObject.property?.[key] || this._selectedObject[key];
    const bool = this.isNotPrivate(key) && (typeof value == 'number' || typeof value == 'string' || typeof value == 'boolean');
    return bool;
  }
  protected isNotPrivate(key: String) {
    return key.startsWith("_") == false
  }

}
