import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import { ColorMaterial } from '@engine/materials/color-material';
import { DefaultInspector } from '../default-inspector/default-inspector';
import {
  ITargetProperty,
  ObjectInspector,
} from '../object-inspector/object-inspector';
import { Color, NumberRange } from '@engine';
import { TextureInspector } from "../texture-inspector/texture-inspector";

@Component({
  selector: 'editor-material-inspector',
  imports: [DefaultInspector, InpectorTogglePanel, ObjectInspector, TextureInspector],
  templateUrl: './material-inspector.html',
  styleUrl: './material-inspector.scss',
})
export class MaterialInspector extends ObjectInspector {
  @Input() set material(value: ColorMaterial) {
    this._selectedObject = {
      key: value.className,
      type: 'material',
      property: value,
    };
    this._material = value;
    this.loadProperties();
  }

  _material!: ColorMaterial;

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

    this._material[item.key] = value;
  }
}
