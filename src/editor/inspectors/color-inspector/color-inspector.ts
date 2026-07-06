import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ColorPickerComponent } from 'src/app/components/color-picker/color-picker';
import { InpectorTogglePanel } from '../../components/inpector-toggle-panel/inpector-toggle-panel';
import { Color } from 'omega-game-engine';

@Component({
  selector: 'editor-color-inspector',
  imports: [ColorPickerComponent, InpectorTogglePanel],
  templateUrl: './color-inspector.html',
  styleUrl: './color-inspector.scss',
})
export class ColorInspector implements OnInit {
  @Input() label: string = 'Color inspector';
  @Input() selectedColor = new Color();
  @Output() colorChange = new EventEmitter<Color>();

  r: string = '';
  g: string = '';
  b: string = '';
  a: string = '';

  colorRgbaString = '';

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.updateLocalStrings(
      this.selectedColor.r,
      this.selectedColor.g,
      this.selectedColor.b,
      this.selectedColor.a,
    );
  }

  /**
   * Calculates high-contrast text color based on background luminance
   */
  get textColor(): string {
    if (!this.selectedColor) return '#ffffff';

    // YIQ formula to calculate perceived brightness
    const yiq =
      (this.selectedColor.r * 255 * 299 +
        this.selectedColor.g * 255 * 587 +
        this.selectedColor.b * 255 * 114) /
      1000;

    return yiq >= 128 ? '#111827' : '#f9fafb';
  }

  onColorChanged($event: {
    rgba: { r: number; g: number; b: number; a: number };
    hex: string;
  }) {
    this.updateLocalStrings(
      $event.rgba.r,
      $event.rgba.g,
      $event.rgba.b,
      $event.rgba.a,
    );
    this.selectedColor.set(
      $event.rgba.r,
      $event.rgba.g,
      $event.rgba.b,
      $event.rgba.a,
    );
    this.colorChange.emit(this.selectedColor);
  }

  private updateLocalStrings(r: number, g: number, b: number, a: number): void {
    this.r = r.toFixed(2);
    this.g = g.toFixed(2);
    this.b = b.toFixed(2);
    this.a = a.toFixed(2);
  }
}
