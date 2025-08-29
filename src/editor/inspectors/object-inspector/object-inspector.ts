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
import { GlEntity } from '@engine/entities';
import { ColorMaterial } from '@engine/materials';
import { Shader } from '@engine/shaders/shader';

export interface ITargetObject {
  [key: string]: any;
  key: string, type: string, property: any
}

export interface ITargetProperty extends ITargetObject {
  value: any
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
  @Input() validTypes: string[] = ["string", "boolean", "number", "shader", "material", "color", "mesh"];

  @Input() label: string = "No title";

  @Input() set targetObject(value: ITargetObject) {
    this._selectedObject = value;
    this.loadProperties();
  }
  @Output() change = new EventEmitter();

  _selectedObject?: ITargetObject;
  _properties: any[] = [];


  onValueChanged(property: ITargetObject, value: string | number | boolean) {
    if (!this._selectedObject || (value as any) instanceof Event) return;
    debugger
    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
  }

  onVectorChanged(property: ITargetObject, value: Vector4 | Vector3 | Vector2) {
    if (!this._selectedObject || (value as any) instanceof Event) return;

    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
  }

  onColorChanged(property: ITargetObject, value: Color) {
    if (!this._selectedObject || (value as any) instanceof Event) return;

    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
  }



  protected loadProperties() {
    if (!this._selectedObject?.property) {
      console.debug("Error: ", !this._selectedObject);
      return
    };

    this._properties = [];
    const object = this._selectedObject.property;
    const keys = Object.keys(object).filter(this.isPropertyValid.bind(this));
    for (const key of keys) {
      const newValue = (object)[key];
      let newObType: string = typeof newValue;
      if (newObType == 'object') {
        newObType = this.getObjectType(newValue);
      }
      this._properties.push({ key, type: newObType, value: newValue });
      console.debug(this._properties)
    }
  }

  getObjectType(newValue: Object): string {
    let result = newValue.constructor.name;

    if (newValue instanceof GlEntity)
      result = 'entity';
    if (newValue instanceof Shader)
      result = Shader.name;
    if (newValue instanceof ColorMaterial)
      result = 'material';
    if (newValue instanceof Float32Array)
      result = "vector234";

    return result.replace("_", "").toLowerCase()
  }

  protected isPropertyValid(key: string) {
    const notPrivate = key.startsWith("_") == false;
    if (this.allowProperties.length > 0) return this.allowProperties.includes(key) && notPrivate;
    if (this.denyProperties.length > 0) return this.denyProperties.includes(key) == false && notPrivate;
    return notPrivate;
  }


  protected isValidPropertyType(key: string): boolean {
    if (!this._selectedObject) return false;
    const value = this._selectedObject.property?.[key] || this._selectedObject[key];
    const bool = this.isNotPrivate(key) && this.validTypes.includes(typeof value);
    debugger
    return bool;
  }
  protected isNotPrivate(key: String) {
    return key.startsWith("_") == false
  }

}
