import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { TextInputInspector } from "../../components/inspector/text-input-inspector/text-input-inspector";
import { Toggle } from "src/app/components/toggle/toggle";
import { ColorInspector } from "../color-inspector/color-inspector";
import { VectorInspector } from "../../components/inspector/vector-inspector/vector-inspector";
import { Color } from '@engine/core';
import { Vector4, Vector3, Vector2 } from '@engine/core/vector';

@Component({
  selector: 'editor-object-inspector',
  imports: [InpectorTogglePanel, TextInputInspector, Toggle, ColorInspector, VectorInspector],
  templateUrl: './object-inspector.html',
  styleUrl: './object-inspector.scss'
})
export class ObjectInspector {


  @Input() allowProperties: string[] = [];
  @Input() denyProperties: string[] = [];
  @Input() title: string = "No title";

  @Input() set targetObject(value: Object) {
    this._selectedObject = value;
    this.loadProperties();
  }
  @Output() change = new EventEmitter();

  _selectedObject: any = null;
  _properties: any[] = [];


  onValueChanged(property: any, value: string | number | boolean) {
    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
  }

  onVectorChanged(property: any, value: Vector4 | Vector3 | Vector2) {
    throw new Error('Method not implemented.');
  }

  onColorChanged(value: Color) {
    throw new Error('Method not implemented.');
  }



  protected loadProperties() {
    this._properties = [];
    const keys = Object.keys(this._selectedObject.property).filter(this.isPropertyValid.bind(this));
    for (const key of keys) {
      const newValue = (this._selectedObject.property as any)[key];
      this._properties.push({ key, type: typeof newValue, value: newValue });
    }
    console.debug("Inpector keys", keys, this._properties)
  }

  protected isPropertyValid(key: string) {
    if (this.allowProperties.length > 0) return this.allowProperties.includes(key);
    if (this.denyProperties.length > 0) return this.denyProperties.includes(key) == false;
    return this.isValidPropertyType(key);
  }


  protected isValidPropertyType(key: string) {
    const value = this._selectedObject?.property?.[key]
    const bool = (typeof value == 'number' || typeof value == 'string')
    return bool;
  }

}
