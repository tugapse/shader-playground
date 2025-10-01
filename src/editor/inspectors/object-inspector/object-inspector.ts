import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { Color, ColorMaterial, EntityBehaviour, GlEntity, LitMaterial, Shader, Texture, Transform, UnlitMaterial, Vector2, Vector3, Vector4 } from 'omega-game-engine';
import { BooleanInspector } from "../../components/inspector/boolean-inspector/boolean-inspector";
import { TextInputInspector } from "../../components/inspector/text-input-inspector/text-input-inspector";
import { VectorInspector } from "../../components/inspector/vector-inspector/vector-inspector";
import { ColorInspector } from "../color-inspector/color-inspector";
import { EnumInspector } from "../enum-inspector/enum-inspector";


export interface ITargetObject {
  [key: string]: any;
  key: string, type: string, property?: any, name?: string
}

export interface ITargetProperty extends ITargetObject {
  value: any
}


@Component({
  selector: 'editor-object-inspector',
  imports: [InpectorTogglePanel, TextInputInspector, ColorInspector,
    VectorInspector, BooleanInspector, EnumInspector],
  templateUrl: './object-inspector.html',
  styleUrl: './object-inspector.scss'
})
export class ObjectInspector {


  @Input() allowProperties: string[] = [];
  @Input() denyProperties: string[] = ["meshData", "gl", "mesh"];
  @Input() validTypes: string[] = ["string", "boolean", "number", "shader", "material", "color", "mesh", "vetor234"];

  @Input() label: string = "No title";
  @Input() isChild = false;

  @Input() set targetObject(value: ITargetObject) {
    this._selectedObject = value;
    this.loadProperties();
  }
  @Input() showPrivateProperties = false;
  @Input() showAllProperties = false;

  @Output() change = new EventEmitter();

  _selectedObject?: ITargetObject;
  _properties: ITargetProperty[] = [];


  onValueChanged(property: ITargetObject, value: string | number | boolean) {
    if (!this._selectedObject || (value as any) instanceof Event) return;
    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
    this.loadProperties();

  }

  onVectorChanged(property: ITargetObject, value: Vector4 | Vector3 | Vector2) {
    if (!this._selectedObject || (value as any) instanceof Event) return;

    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
    this.loadProperties();

  }

  onColorChanged(property: ITargetObject, value: Color) {
    if (!this._selectedObject || (value as any) instanceof Event) return;

    this._selectedObject.property[property.key] = value;
    this.change.emit(this._selectedObject.property);
    this.loadProperties();
  }



  protected loadProperties() {
    if (!this._selectedObject?.property) {
      return
    };

    this._properties = [];
    const object = this._selectedObject.property;
    const keys = Object.keys(object).filter(this.isPropertyValid.bind(this));
    for (const key of keys) {
      const newValue = (object)[key];
      if(!newValue) continue;
      let newObType: string = typeof newValue;
      let name = "";
      // console.debug(key, this.getObjectType(newValue), newValue instanceof Color, newValue instanceof Shader);
      if (newObType == 'object') {
        newObType = this.getObjectType(newValue);
        name = newValue.name
      }

      this._properties.push({ key, type: newObType, value: newValue, name });
      // console.debug(this._properties)
    }
  }

  getObjectType(newValue: Object): string {
    const className = (newValue as any)['className'];
    let result = (typeof newValue) as string;

    if (className) {
      switch (className) {
        case 'Color':
          return 'color';
        case 'GLEntity':
          return 'entity';
      }
    }


    if (newValue instanceof Transform)
      result = 'transform';
    if (newValue instanceof GlEntity)
      result = 'entity';
    if (newValue instanceof EntityBehaviour)
      result = 'entityBehaviour';
    if (newValue instanceof Shader)
      result = 'shader';
    if (newValue instanceof Texture)
      result = 'texture';
    // if (newValue instanceof Color)
    //   result = 'color';
    if (newValue instanceof ColorMaterial || newValue instanceof LitMaterial || newValue instanceof UnlitMaterial)
      result = 'material';
    if (newValue instanceof Vector2 || newValue instanceof Vector3 || newValue instanceof Vector4 || newValue instanceof Float32Array)
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
    console.debug("I was called !!!!")
    if (!this._selectedObject) return false;
    const value = this._selectedObject.property?.[key] || this._selectedObject[key];
    const obType = this.getObjectType(value)
    const bool = this.showAllProperties ? true : (this.isNotPrivate(key) && this.validTypes.includes(obType));

    return bool;
  }
  protected isNotPrivate(key: String) {
    if (this.showPrivateProperties) return true;
    return key.startsWith("_") == false
  }

}
