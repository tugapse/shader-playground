import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { Color } from '@engine/core/color';
import { ColorPickerComponent } from "src/app/components/color-picker/color-picker";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";
import { GlEntity } from '@engine/entities';

@Component({
  selector: 'editor-color-inspector',
  imports: [ColorPickerComponent, InpectorTogglePanel],
  templateUrl: './color-inspector.html',
  styleUrl: './color-inspector.scss'
})
export class ColorInspector implements OnInit {

  @Input() label: string = "Color inspector";
  @Input() selectedColor = new Color();
  @Output() colorChange = new EventEmitter<Color>();

  colorRgbaString = "";
  // Inject NgZone into the constructor
  constructor(private zone: NgZone) { }

  ngOnInit() {
  }

  onColorChanged($event: { rgba: { r: number; g: number; b: number; a: number; }; hex: string; }) {
    this.zone.run(() => {
      this.colorRgbaString = `"rgba(${$event.rgba.r * 255} ,${$event.rgba.g}, ${$event.rgba.b} ,${$event.rgba.a});"`
      this.colorChange.emit(new Color($event.rgba.r, $event.rgba.g, $event.rgba.b, $event.rgba.a));
    });

  }

}
