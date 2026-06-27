import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import {
  Color,
  EngineCache,
  NumberRange,
  Shader,
  ShaderSources,
} from '@engine';
import { DefaultInspector } from '../default-inspector/default-inspector';
import { MaterialInspector } from '../material-inspector/material-inspector';
import {
  ITargetProperty,
  ObjectInspector,
} from '../object-inspector/object-inspector';
import {
  DropdownItem,
  DropdownComponent,
} from 'src/app/components/dropdown/dropdown';

@Component({
  selector: 'editor-shader-inspector',
  imports: [
    MaterialInspector,
    InpectorTogglePanel,
    DefaultInspector,
    ObjectInspector,
    DropdownComponent,
  ],
  templateUrl: './shader-inspector.html',
  styleUrl: './shader-inspector.scss',
})
export class ShaderInspector extends ObjectInspector {
  _shader!: Shader;

  _shaderFraList: DropdownItem[] = [];
  _shaderVertList: DropdownItem[] = [];

  get selectedFrag() {
    return this._shaderFraList.find((f) => f.value == this._shader.fragUri);
  }
  get selectedVert() {
    return this._shaderVertList.find((f) => f.value == this._shader.vertexUri);
  }

  @Input() set shader(value: Shader) {
    this._shader = value;
    this._selectedObject = {
      key: value.className,
      type: 'shader',
      property: value,
    };
    this.loadProperties();
    const ignored = ['handle', 'entity', 'entity_picker', 'retro'];
    const debug = false;

    const fragKeys = Object.keys(ShaderSources.frag);
    this._shaderFraList = fragKeys
      .filter(
        (e) =>
          !(ShaderSources.frag as any)[e].includes('/tools/') &&
          !(ShaderSources.frag as any)[e].includes('/functions/') &&
          !ignored.includes(e),
      )
      .map((key) => ({
        key,
        value: (ShaderSources.frag as any)[key],
      }));
    const vertKeys = Object.keys(ShaderSources.vertex);

    this._shaderVertList = vertKeys
      .filter(
        (e) =>
          !(ShaderSources.vertex as any)[e].includes('/functions/') &&
          !ignored.includes(e),
      )
      .map((key) => ({
        key,
        value: (ShaderSources.vertex as any)[key],
      }));
  }
  get shader() {
    return this._shader;
  }

  constructor() {
    super();
    this.denyProperties.push('fragUri', 'vertexUri');
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

  onShaderSelected(shaderIndex: number, $event: DropdownItem) {
    const shaderKey = ['fragUri', 'vertexUri'][shaderIndex];
    this._shader[shaderKey] = $event.value;
    debugger;
    this._shader.recompile();
  }
}
