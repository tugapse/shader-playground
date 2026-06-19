import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { ColorPickerComponent } from "src/app/components/color-picker/color-picker";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";
import { Color } from '@engine';

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
  constructor(private changeDetector:ChangeDetectorRef) { }

  ngOnInit() {
  }

  onColorChanged($event: { rgba: { r: number; g: number; b: number; a: number; }; hex: string; }) {
      this.r = ($event.rgba.r ).toFixed(2).toString();
      this.g = ($event.rgba.g ).toFixed(2).toString();
      this.b = ($event.rgba.b ).toFixed(2).toString();
      this.a = ($event.rgba.a ).toFixed(2).toString();

      this.colorChange.emit(new Color($event.rgba.r, $event.rgba.g, $event.rgba.b, $event.rgba.a));
      this.changeDetector.detectChanges();
  } 

}
