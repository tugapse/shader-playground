import { CommonModule } from "@angular/common";
import {
  AfterViewInit, Component, ElementRef,
  EventEmitter, HostListener, Input, NgZone, OnInit, Output, ViewChild, OnDestroy
} from "@angular/core";

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.html',
  styleUrls: ['./color-picker.scss'],
  standalone: true, // Assuming it's standalone, based on your previous examples
  imports: [CommonModule]
})
export class ColorPickerComponent implements OnInit, AfterViewInit, OnDestroy {


  @ViewChild('colorArea', { static: true }) colorArea!: ElementRef<HTMLDivElement>;
  @ViewChild('colorPointer', { static: true }) colorPointer!: ElementRef<HTMLDivElement>;
  @ViewChild('hueSlider', { static: true }) hueSlider!: ElementRef<HTMLDivElement>;
  @ViewChild('huePointer', { static: true }) huePointer!: ElementRef<HTMLDivElement>;
  @ViewChild('alphaSlider', { static: true }) alphaSlider!: ElementRef<HTMLDivElement>;
  @ViewChild('alphaPointer', { static: true }) alphaPointer!: ElementRef<HTMLDivElement>;


  @Input() set color(value: { r: number, g: number, b: number, a: number }) {
    if (!value) return; // Handle null/undefined input gracefully

    const hsv = this.rgb01ToHsv(value.r, value.g, value.b);
    this.hue = hsv.h;
    this.saturation = hsv.s;
    this.value = hsv.v;
    this.alpha = value.a; // Ensure alpha is also updated from input
    this.updateAllColors();
    this.updateColorPointerPosition();
    this.updateHuePointerPosition();
    this.updateAlphaPointerPosition();
  }

  @Output() colorChange = new EventEmitter<{ rgba: { r: number, g: number, b: number, a: number }, hex: string }>();

  public hue: number = 286; // 0-360 degrees
  public saturation: number = 0.41; // 0-1
  public value: number = 0.50; // 0-1 (brightness)
  public alpha: number = 1; // 0-1

  public rgba: { r: number, g: number, b: number, a: number } = { r: 0, g: 0, b: 0, a: 1 };
  public rgb255: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 };
  public hex: string = '#000000';
  public cmyk: { c: number, m: number, y: number, k: number } = { c: 0, m: 0, y: 0, k: 1 };
  public hsl: { h: number, s: number, l: number } = { h: 0, s: 0, l: 0 };

  public isColorAreaDragging: boolean = false;
  public isHueSliderDragging: boolean = false;
  public isAlphaSliderDragging: boolean = false;

  private resizeObserver: ResizeObserver | null = null; // Declare ResizeObserver

  constructor(private zone: NgZone) { }

  ngOnInit(): void {
    this.updateAllColors();
  }

  ngAfterViewInit(): void {
    this.updateColorPointerPosition();
    this.updateHuePointerPosition();
    this.updateAlphaPointerPosition();
    this.setupResizeObserver(); // Set up the observer after view is initialized
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect(); // Disconnect observer to prevent memory leaks
  }

  onColorAreaMousedown(event: MouseEvent): void {
    event.preventDefault(); // Prevents the default browser action, like text selection
    this.isColorAreaDragging = true;
    this.updateColorFromColorArea(event);
  }

  onHueSliderMousedown(event: MouseEvent): void {
    event.preventDefault(); // Prevents the default browser action, like text selection
    this.isHueSliderDragging = true;
    this.updateHueFromHueSlider(event);
  }

  onAlphaSliderMousedown(event: MouseEvent) {
    event.preventDefault(); // Prevents the default browser action, like text selection
    this.isAlphaSliderDragging = true;
    this.updateAlphaFromAlphaSlider(event);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    event.preventDefault(); // Prevents the default browser action, like text selection
    this.zone.run(() => {
      if (this.isColorAreaDragging) {
        this.updateColorFromColorArea(event);
      } else if (this.isHueSliderDragging) {
        this.updateHueFromHueSlider(event);
      } else if (this.isAlphaSliderDragging) {
        this.updateAlphaFromAlphaSlider(event);
      }
    });
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.zone.run(() => {
      this.isColorAreaDragging = false;
      this.isHueSliderDragging = false;
      this.isAlphaSliderDragging = false;
    });
  }

  /**
   * Sets up a ResizeObserver to monitor changes in the dimensions of colorArea and hueSlider.
   * When a resize is detected, it triggers updates to pointer positions.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      this.zone.run(() => {
        for (const entry of entries) {
          if (entry.target === this.colorArea.nativeElement || entry.target === this.hueSlider.nativeElement) {
            // Re-update pointer positions on resize
            this.updateColorPointerPosition();
            this.updateHuePointerPosition();
            this.updateAlphaPointerPosition();
          }
        }
      });
    });

    this.resizeObserver.observe(this.colorArea.nativeElement);
    this.resizeObserver.observe(this.hueSlider.nativeElement);
  }

  private updateColorFromColorArea(event: MouseEvent): void {
    const rect = this.colorArea.nativeElement.getBoundingClientRect();

    // Clamp the mouse coordinates to the bounds of the color area
    const clampedX = Math.max(rect.left, Math.min(event.clientX, rect.right));
    const clampedY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));

    let x = clampedX - rect.left;
    let y = clampedY - rect.top;

    if (rect.width > 0) {
      this.saturation = x / rect.width;
    }
    if (rect.height > 0) {
      this.value = 1 - (y / rect.height);
    }

    this.updateAllColors();
    this.updateColorPointerPosition();
  }

  private updateHueFromHueSlider(event: MouseEvent): void {
    const rect = this.hueSlider.nativeElement.getBoundingClientRect();
    const clampedX = Math.max(rect.left, Math.min(event.clientX, rect.right));
    let x = clampedX - rect.left;

    if (rect.width > 0) {
      this.hue = (x / rect.width) * 360;
    }

    this.updateAllColors();
    this.updateHuePointerPosition();
  }

   private updateAlphaFromAlphaSlider(event: MouseEvent): void {
    const rect = this.alphaSlider.nativeElement.getBoundingClientRect();
    const clampedY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));
    let y = clampedY - rect.top;

    if (rect.height > 0) {
      this.alpha = 1 - (y / rect.height);
    }

    this.updateAllColors();
    this.updateAlphaPointerPosition();
  }

  private updateColorPointerPosition(): void {
    // Only update if colorArea is ready and has dimensions
    if (!this.colorArea || !this.colorArea.nativeElement.clientWidth) return;

    const rect = this.colorArea.nativeElement.getBoundingClientRect();
    const x = this.saturation * rect.width;
    const y = (1 - this.value) * rect.height;
    this.colorPointer.nativeElement.style.left = `${x}px`;
    this.colorPointer.nativeElement.style.top = `${y}px`;
  }

  private updateHuePointerPosition(): void {
    // Only update if hueSlider is ready and has dimensions
    if (!this.hueSlider || !this.hueSlider.nativeElement.clientWidth) return;

    const rect = this.hueSlider.nativeElement.getBoundingClientRect();
    const x = (this.hue / 360) * rect.width;
    this.huePointer.nativeElement.style.left = `${x}px`;
  }

  private updateAlphaPointerPosition(): void {
    // Only update if hueSlider is ready and has dimensions
    if (!this.alphaSlider || !this.alphaSlider.nativeElement.clientWidth) return;

    const rect = this.alphaSlider.nativeElement.getBoundingClientRect();
    const y = (1-this.alpha) * rect.height;
    this.alphaPointer.nativeElement.style.top = `${y}px`;
  }

  private updateAllColors(): void {
    this.rgba = this.hsvToRgb01(this.hue, this.saturation, this.value, this.alpha);
    this.rgb255 = this.rgb01ToRgb255(this.rgba.r, this.rgba.g, this.rgba.b);
    this.hex = this.rgb255ToHex(this.rgb255.r, this.rgb255.g, this.rgb255.b);
    this.cmyk = this.rgb255ToCmyk(this.rgb255.r, this.rgb255.g, this.rgb255.b);
    this.hsl = this.rgb01ToHsl(this.rgba.r, this.rgba.g, this.rgba.b);
    this.colorChange.emit({ rgba: this.rgba, hex: this.hex });
  }

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

  private rgb01ToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;

    if (delta === 0) {
      h = 0;
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

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
  }

  private rgb01ToRgb255(r: number, g: number, b: number): { r: number, g: number, b: number } {
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  private rgb255ToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private rgb255ToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    let k = 1 - Math.max(r, g, b);
    let c = (1 - r - k) / (1 - k);
    let m = (1 - g - k) / (1 - k);
    let y = (1 - b - k) / (1 - k);

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

  private rgb01ToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
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
