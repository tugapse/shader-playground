import { Component, Input } from '@angular/core';
import { Color, NumberRange, Texture, TextureFilterMode, TextureWrapMode } from '@engine';
import { InpectorTogglePanel } from '../../components/inpector-toggle-panel/inpector-toggle-panel';
import {
  ITargetProperty,
  ObjectInspector,
} from '../object-inspector/object-inspector';
import { DefaultInspector } from '../default-inspector/default-inspector';

@Component({
  selector: 'editor-texture-inspector',
  imports: [InpectorTogglePanel, ObjectInspector, DefaultInspector],
  templateUrl: './texture-inspector.html',
  styleUrl: './texture-inspector.scss',
})
export class TextureInspector extends ObjectInspector {

  get texture() {
    return this._selectedObject?.property as Texture;
  }

  

  constructor() {
    super();
    this._enums['minFilter'] = this.convertEnumToObject(TextureFilterMode);
    this._enums['magFilter'] = this.convertEnumToObject(TextureFilterMode);
    this._enums['wrapS'] = this.convertEnumToObject(TextureWrapMode);
    this._enums['wrapT'] = this.convertEnumToObject(TextureWrapMode);
    this.denyProperties.push ('isLoading','isLoaded', 'image', "textureUri")
  }


  ngOnInit() {}

  onDefaultChanged(
    targetProperty: ITargetProperty,
    $event: string | number | boolean | NumberRange | Color,
  ) {
    if ($event instanceof Event) return;
    this.texture[targetProperty.key] = $event;
    if( Object.keys(this._enums).includes( targetProperty.key) ){
      this.texture.rebuild()
    }
  }


}
