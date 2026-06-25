import { Component, Input } from '@angular/core';
import { Texture } from '@engine';
import { InpectorTogglePanel } from '../../components/inpector-toggle-panel/inpector-toggle-panel';

@Component({
  selector: 'editor-texture-inspector',
  imports: [InpectorTogglePanel],
  templateUrl: './texture-inspector.html',
  styleUrl: './texture-inspector.scss',
})
export class TextureInspector  {
  @Input() texture!: Texture;

  ngOnInit() {
    ;
  }
}
