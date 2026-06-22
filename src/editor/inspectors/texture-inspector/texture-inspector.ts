import { Component, Input } from '@angular/core';
import { Texture } from '@engine';
import { InpectorTogglePanel } from '../../components/inpector-toggle-panel/inpector-toggle-panel';
import { ObjectInspector } from '../object-inspector/object-inspector';

@Component({
  selector: 'editor-texture-inspector',
  imports: [InpectorTogglePanel],
  templateUrl: './texture-inspector.html',
  styleUrl: './texture-inspector.scss',
})
export class TextureInspector extends ObjectInspector {
  @Input() texture!: Texture;

  ngOnInit() {
    ;
  }
}
