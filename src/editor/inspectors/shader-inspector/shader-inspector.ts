import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import { Color, NumberRange, Shader } from '@engine';
import { DefaultInspector } from '../default-inspector/default-inspector';
import { MaterialInspector } from '../material-inspector/material-inspector';
import {
  ITargetProperty,
  ObjectInspector,
} from '../object-inspector/object-inspector';

@Component({
  selector: 'editor-shader-inspector',
  imports: [
    MaterialInspector,
    InpectorTogglePanel,
    DefaultInspector,
    ObjectInspector,
  ],
  templateUrl: './shader-inspector.html',
  styleUrl: './shader-inspector.scss',
})
export class ShaderInspector extends ObjectInspector {
  _shader!: Shader;

  @Input() set shader(value: Shader) {
    this._shader = value;
    this._selectedObject = {
      key: value.className,
      type: 'shader',
      property: value,
    };
    this.loadProperties();
  }

  protected override loadProperties(): void {
    if (!this._selectedObject?.property) {
      this._properties = [];
      return;
    }

    const object = this._selectedObject.property;
    this._properties = Object.keys(object)
      .filter((key) => this.isPropertyValid(key))
      .map((key) => super.createPropertyViewModel(key, object[key]))
      .filter((p) => !!p.key);
  }

  onDefaultChanged(
    item: ITargetProperty,
    value: string | number | boolean | NumberRange | Color,
  ) {
    if (value instanceof Event) return;
    this._shader[item.key] = value;
  }
}
