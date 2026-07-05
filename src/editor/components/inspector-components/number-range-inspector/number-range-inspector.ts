import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { NumberRange } from 'omega-game-engine';

@Component({
  selector: 'editor-number-range-inspector',
  standalone: true,
  imports: [],
  templateUrl: './number-range-inspector.html',
  styleUrl: './number-range-inspector.scss',
})
export class NumberRangeInspector implements OnDestroy {
  @Input() label: string = '';
  @Input() range!: NumberRange;
  @Output() rangeChange = new EventEmitter<NumberRange>();

  @ViewChild('sliderInput') sliderInput!: ElementRef<HTMLInputElement>;

  private isDraggingLabel = false;
  private lastX = 0;
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  private originalCursor: string = '';

  constructor(
    private renderer: Renderer2,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  // --- Label Drag Logic (Virtual Slide Feature) ---
  startLabelDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingLabel = true;
    this.lastX = event.clientX;

    this.originalCursor = document.body.style.cursor;
    this.renderer.setStyle(document.body, 'cursor', 'ew-resize', 1);
    this.renderer.addClass(document.body, 'no-select');

    this.unlistenMouseMove = this.renderer.listen(
      'window',
      'mousemove',
      (e: MouseEvent) => this.handleLabelMove(e),
    );
    this.unlistenMouseUp = this.renderer.listen('window', 'mouseup', () =>
      this.stopLabelDrag(),
    );
  }

  private handleLabelMove(event: MouseEvent): void {
    if (!this.isDraggingLabel || !this.range) return;

    this.zone.run(() => {
      const deltaX = event.clientX - this.lastX;
      if (deltaX === 0) return;

      const pixelsForFullRange = 200;
      const rangeSpan = this.range.max - this.range.min;
      const offset = (deltaX / pixelsForFullRange) * rangeSpan;

      let newValue = this.range.value + offset;
      newValue = this.clampAndRound(newValue);

      if (newValue !== this.range.value) {
        this.lastX = event.clientX;
        this.updateValue(newValue);
      }
    });
  }

  private stopLabelDrag(): void {
    if (!this.isDraggingLabel) return;

    this.zone.run(() => {
      this.isDraggingLabel = false;
      this.renderer.setStyle(document.body, 'cursor', this.originalCursor);
      this.renderer.removeClass(document.body, 'no-select');
      this.destroyListeners();
    });
  }

  // --- Native Element Input Hooks ---
  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateValue(parseFloat(input.value));
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateValue(parseFloat(input.value));
  }

  // --- Core State Updates ---
  private updateValue(value: number): void {
    if (!isNaN(value) && this.range && this.range.value !== value) {
      this.range.value = value;
      this.rangeChange.emit(this.range);

      // Make sure the slider UI snaps cleanly if updated via label or input box
      if (this.sliderInput?.nativeElement) {
        this.sliderInput.nativeElement.value = value.toString();
      }

      this.cdr.detectChanges();
    }
  }

  private clampAndRound(val: number): number {
    if (this.range.step > 0) {
      val = Math.round(val / this.range.step) * this.range.step;
    }
    return Math.max(this.range.min, Math.min(this.range.max, val));
  }

  private destroyListeners(): void {
    if (this.unlistenMouseMove) this.unlistenMouseMove();
    if (this.unlistenMouseUp) this.unlistenMouseUp();
    this.unlistenMouseMove = null;
    this.unlistenMouseUp = null;
  }

  ngOnDestroy(): void {
    this.stopLabelDrag();
  }
}
