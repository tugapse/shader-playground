import { Component } from '@angular/core';
import { ColorPickerComponent } from "src/app/components/color-picker/color-picker/color-picker";

@Component({
  selector: 'editor-color-inspector',
  imports: [ColorPickerComponent],
  templateUrl: './color-inspector.html',
  styleUrl: './color-inspector.scss'
})
export class ColorInspector {

}
