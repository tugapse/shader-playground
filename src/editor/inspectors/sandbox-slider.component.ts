import { Component, ElementRef, ViewChild, Renderer2, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-sandbox-slider',
  standalone: true,
  template: `
    <div class="sandbox-container">
      <span 
        class="drag-label"
        (mousedown)="startDrag($event)">
        DRAG ME (Value: {{ value }})
      </span>
      
      <div class="slider-wrapper">
        <input
          #sliderInput
          type="range"
          min="0"
          max="100"
          step="1"
          [value]="value"
          (input)="onSliderInput($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .sandbox-container {
      padding: 20px;
      background: #1e293b;
      color: #f8fafc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 300px;
      margin: 20px auto;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      font-family: sans-serif;
    }
    .drag-label {
      background: #3b82f6;
      padding: 8px;
      text-align: center;
      border-radius: 4px;
      cursor: ew-resize;
      user-select: none;
      font-weight: bold;
    }
    .slider-wrapper {
      display: flex;
      align-items: center;
    }
    input[type="range"] {
      width: 100%;
      cursor: pointer;
    }
  `]
})
export class SandboxSliderComponent implements OnDestroy {
  // Completely isolated primitive state
  value: number = 32;

  private isDragging = false;
  private lastX = 0;
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;

  @ViewChild('sliderInput') sliderInput!: ElementRef<HTMLInputElement>;

  constructor(private renderer: Renderer2) {}

  // 1. Initial Grab Hook
  startDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.lastX = event.clientX;

    console.log('🏁 [POC] Drag started at X:', this.lastX);

    // Lock listeners to the global window space cleanly
    this.unlistenMouseMove = this.renderer.listen('window', 'mousemove', (e: MouseEvent) => this.handleMove(e));
    this.unlistenMouseUp = this.renderer.listen('window', 'mouseup', () => this.stopDrag());
  }

  // 2. Continuous Pull Hook
  private handleMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastX;
    if (deltaX === 0) return;

    const pixelsForFullRange = 200;
    const range = 100; // max (100) - min (0)
    const offset = (deltaX / pixelsForFullRange) * range;

    let newValue = this.value + offset;
    newValue = Math.max(0, Math.min(100, Math.round(newValue)));

    if (newValue !== this.value) {
      console.log(`🚀 [POC] Moving! Delta: ${deltaX}px | Old: ${this.value} -> New: ${newValue}`);
      
      this.value = newValue;
      this.lastX = event.clientX;

      // Force the browser's raw DOM element to update its layout instantly
      if (this.sliderInput && this.sliderInput.nativeElement) {
        this.sliderInput.nativeElement.value = newValue.toString();
      }
    }
  }

  // 3. Release Hook
  private stopDrag(): void {
    if (!this.isDragging) return;
    console.log('🛑 [POC] Drag stopped.');
    
    this.isDragging = false;
    this.destroyListeners();
  }

  // Handle manual clicks directly on the slider track
  onSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = parseInt(target.value, 10);
    console.log('🎛️ [POC] Track clicked/moved directly. Value:', this.value);
  }

  private destroyListeners(): void {
    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyListeners();
  }
}