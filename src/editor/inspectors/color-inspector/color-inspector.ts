import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { Color } from '@engine/core/color';
import { ColorPickerComponent } from "src/app/components/color-picker/color-picker/color-picker";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";

@Component({
  selector: 'editor-color-inspector',
  imports: [ColorPickerComponent, InpectorTogglePanel],
  templateUrl: './color-inspector.html',
  styleUrl: './color-inspector.scss'
})
export class ColorInspector implements OnInit {

  @Input() entity?: { [key: string]: any }
  @Input() propertyName: string = "";
  @Input() selectedColor = new Color();

  @Output() colorChange = new EventEmitter<Color>();

  title!: string;
  colorRgbaString = "";
  // Inject NgZone into the constructor
  constructor(private zone: NgZone) { }

  ngOnInit() {
    this.title = this.propertyName.capitalize();
  }

  onColorChanged($event: { rgba: { r: number; g: number; b: number; a: number; }; hex: string; }) {
    if (this.entity) this.entity[this.propertyName] = this.selectedColor.clone()
    this.zone.run(() => {
      this.selectedColor = new Color($event.rgba.r, $event.rgba.g, $event.rgba.b, $event.rgba.a);
      this.colorRgbaString = `"rgba(${this.selectedColor.r * 255} ,${this.selectedColor.g}, ${this.selectedColor.b} ,${this.selectedColor.a});"`
      this.colorChange.emit(this.selectedColor.clone());
    });

  }

}
