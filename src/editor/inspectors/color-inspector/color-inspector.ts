import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { ColorPickerComponent } from "src/app/components/color-picker/color-picker";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";
import { Color } from 'omega-game-engine';

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

  r:string = "";
  g:string = "";
  b:string = "";
  a:string = "";

  colorRgbaString = "";
  // Inject NgZone into the constructor
  constructor(private zone: NgZone) { }

  ngOnInit() {
  }

  onColorChanged($event: { rgba: { r: number; g: number; b: number; a: number; }; hex: string; }) {
    this.zone.run(() => {
      this.r = Math.floor($event.rgba.r * 255).toString();
      this.g = Math.floor($event.rgba.g * 255).toString();
      this.b = Math.floor($event.rgba.b * 255).toString();
      this.a = Math.floor($event.rgba.a * 255).toString();

      this.colorRgbaString = `"rgba(${$event.rgba.r * 255} ,${$event.rgba.g}, ${$event.rgba.b} ,${$event.rgba.a});"`
      this.colorChange.emit(new Color($event.rgba.r, $event.rgba.g, $event.rgba.b, $event.rgba.a));
    });

  }

}
