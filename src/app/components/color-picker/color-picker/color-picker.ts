import { CommonModule } from "@angular/common";
import {
  AfterViewInit, Component, ElementRef,
  EventEmitter, HostListener, Input, NgZone, OnInit, Output, ViewChild
} from "@angular/core";

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.html',
  styleUrls: ['./color-picker.scss'],
  imports: [CommonModule]
})
export class ColorPickerComponent implements OnInit, AfterViewInit {

  // ViewChild decorators to get references to the color area and hue slider elements
  @ViewChild('colorArea', { static: true }) colorArea!: ElementRef<HTMLDivElement>;
  @ViewChild('hueSlider', { static: true }) hueSlider!: ElementRef<HTMLDivElement>;
  @ViewChild('colorPointer', { static: true }) colorPointer!: ElementRef<HTMLDivElement>;
  @ViewChild('huePointer', { static: true }) huePointer!: ElementRef<HTMLDivElement>;

  // Input color, the selected color (RGBA 0-1)
  @Input() set color(value: { r: number, g: number, b: number, a: number }) {

    const hsv = this.rgb01ToHsv(value.r, value.g, value.b);
    this.hue = hsv.h;
    this.saturation = hsv.s;
    this.value = hsv.v;
    this.updateAllColors();
  }

  // Output event to emit the selected color (RGBA 0-1 and HEX)
  @Output() colorChange = new EventEmitter<{ rgba: { r: number, g: number, b: number, a: number }, hex: string }>();

  // State variables for color values
  public hue: number = 286; // 0-360 degrees
  public saturation: number = 0.41; // 0-1
  public value: number = 0.50; // 0-1 (brightness)
  public alpha: number = 1; // 0-1

  public rgba: { r: number, g: number, b: number, a: number } = { r: 0, g: 0, b: 0, a: 1 };
  public rgb255: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 };
  public hex: string = '#000000';
  public cmyk: { c: number, m: number, y: number, k: number } = { c: 0, m: 0, y: 0, k: 1 };
  public hsl: { h: number, s: number, l: number } = { h: 0, s: 0, l: 0 };

  // Booleans to track dragging state
  public isColorAreaDragging: boolean = false;
  public isHueSliderDragging: boolean = false;
  public readonly math = Math;

  constructor(private zone: NgZone) { }

  ngOnInit(): void {
    // Initial color calculation
    this.updateAllColors();
  }

  ngAfterViewInit(): void {
    // Set initial pointer positions
    this.updateColorPointerPosition();
    this.updateHuePointerPosition();
  }

  /**
   * Handles mouse down event on the color selection area.
   * @param event MouseEvent
   */
  onColorAreaMousedown(event: MouseEvent): void {
    this.isColorAreaDragging = true;
    this.updateColorFromColorArea(event);
  }

  /**
   * Handles mouse down event on the hue slider.
   * @param event MouseEvent
   */
  onHueSliderMousedown(event: MouseEvent): void {
    this.isHueSliderDragging = true;
    this.updateHueFromHueSlider(event);
  }

  /**
   * Global mouse move listener to update color or hue during drag.
   * Runs inside NgZone to ensure Angular change detection.
   * @param event MouseEvent
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.zone.run(() => {
      if (this.isColorAreaDragging) {
        this.updateColorFromColorArea(event);
      } else if (this.isHueSliderDragging) {
        this.updateHueFromHueSlider(event);
      }
    });
  }

  /**
   * Global mouse up listener to stop dragging.
   * @param event MouseEvent
   */
  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.zone.run(() => {
      this.isColorAreaDragging = false;
      this.isHueSliderDragging = false;
    });
  }

  /**
   * Updates saturation and value based on mouse position in the color area.
   * @param event MouseEvent
   */
  private updateColorFromColorArea(event: MouseEvent): void {
    const rect = this.colorArea.nativeElement.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // Clamp values within the bounds of the color area
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    this.saturation = x / rect.width; // 0-1
    this.value = 1 - (y / rect.height); // 0-1 (brightness, 1 is top)

    this.updateAllColors();
    this.updateColorPointerPosition();
  }

  /**
   * Updates hue based on mouse position in the hue slider.
   * @param event MouseEvent
   */
  private updateHueFromHueSlider(event: MouseEvent): void {
    const rect = this.hueSlider.nativeElement.getBoundingClientRect();
    let x = event.clientX - rect.left;

    // Clamp values within the bounds of the hue slider
    x = Math.max(0, Math.min(x, rect.width));

    this.hue = (x / rect.width) * 360; // 0-360 degrees

    this.updateAllColors();
    this.updateHuePointerPosition();
  }

  /**
   * Updates the position of the saturation/brightness pointer.
   */
  private updateColorPointerPosition(): void {
    const rect = this.colorArea.nativeElement.getBoundingClientRect();
    const x = this.saturation * rect.width;
    const y = (1 - this.value) * rect.height;
    this.colorPointer.nativeElement.style.left = `${x}px`;
    this.colorPointer.nativeElement.style.top = `${y}px`;
  }

  /**
   * Updates the position of the hue slider pointer.
   */
  private updateHuePointerPosition(): void {
    const rect = this.hueSlider.nativeElement.getBoundingClientRect();
    const x = (this.hue / 360) * rect.width;
    this.huePointer.nativeElement.style.left = `${x}px`;
  }

  /**
   * Updates all color format representations based on current HSV values.
   */
  private updateAllColors(): void {
    this.rgba = this.hsvToRgb01(this.hue,this.saturation,this.value,this.alpha);
    this.rgb255 = this.rgb01ToRgb255(this.rgba.r, this.rgba.g, this.rgba.b);
    this.hex = this.rgb255ToHex(this.rgb255.r, this.rgb255.g, this.rgb255.b);
    this.cmyk = this.rgb255ToCmyk(this.rgb255.r, this.rgb255.g, this.rgb255.b);
    this.hsl = this.rgb01ToHsl(this.rgba.r, this.rgba.g, this.rgba.b);
    // Emit the new color value
    this.colorChange.emit({ rgba: this.rgba, hex: this.hex });
  }

  /**
   * Converts HSV color to RGBA (0-1 range).
   * @param h Hue (0-360)
   * @param s Saturation (0-1)
   * @param v Value/Brightness (0-1)
   * @param a Alpha (0-1)
   * @returns RGBA object with values in 0-1 range
   */
  private hsvToRgb01(h: number, s: number, v: number, a: number): { r: number, g: number, b: number, a: number } {
    const C = v * s;
    const X = C * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - C;
    let r_prime = 0, g_prime = 0, b_prime = 0;

    if (h >= 0 && h < 60) {
      r_prime = C; g_prime = X; b_prime = 0;
    } else if (h >= 60 && h < 120) {
      r_prime = X; g_prime = C; b_prime = 0;
    } else if (h >= 120 && h < 180) {
      r_prime = 0; g_prime = C; b_prime = X;
    } else if (h >= 180 && h < 240) {
      r_prime = 0; g_prime = X; b_prime = C;
    } else if (h >= 240 && h < 300) {
      r_prime = X; g_prime = 0; b_prime = C;
    } else { // h >= 300 && h < 360
      r_prime = C; g_prime = 0; b_prime = X;
    }

    return { r: r_prime + m, g: g_prime + m, b: b_prime + m, a };
  }

  /**
  * Converts RGB (0-1 range) to HSV.
  * @returns HSV object with values in the 0-1 range for S and V, and 0-360 for H
  */
  private rgb01ToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;

    // Calculate Hue
    if (delta === 0) {
      h = 0; // achromatic
    } else if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) {
      h += 360;
    }

    // Calculate Saturation and Value
    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
  }

  /**
   * Converts RGB (0-1 range) to RGB (0-255 range).
   * @param r Red (0-1)
   * @param g Green (0-1)
   * @param b Blue (0-1)
   * @returns RGB object with values in 0-255 range
   */
  private rgb01ToRgb255(r: number, g: number, b: number): { r: number, g: number, b: number } {
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Converts RGB (0-255 range) to HEX string.
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns HEX string (e.g., #RRGGBB)
   */
  private rgb255ToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Converts RGB (0-255 range) to CMYK (0-100 range for C,M,Y,K).
   * @param r Red (0-255)
   * @param g Green (0-255)
   * @param b Blue (0-255)
   * @returns CMYK object with values in 0-100 range
   */
  private rgb255ToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    let k = 1 - Math.max(r, g, b);
    let c = (1 - r - k) / (1 - k);
    let m = (1 - g - k) / (1 - k);
    let y = (1 - b - k) / (1 - k);

    // Handle the case where K is 1 (black) to avoid NaN
    if (k === 1) {
      c = 0; m = 0; y = 0;
    }

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  /**
   * Converts RGB (0-1 range) to HSL (H 0-360, S 0-100, L 0-100).
   * @param r Red (0-1)
   * @param g Green (0-1)
   * @param b Blue (0-1)
   * @returns HSL object with H (0-360), S (0-100), L (0-100)
   */
  private rgb01ToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
}
