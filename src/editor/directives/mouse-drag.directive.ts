import { Directive, ElementRef, HostListener, Output, EventEmitter, Renderer2, OnDestroy, Input } from '@angular/core';

/**
 * Defines the possible modes for the drag directive.
 */
export type DragMode = 'horizontal' | 'vertical' | 'both';

/**
 * Interface for the data emitted by the drag event.
 */
export interface DragEventData {
  deltaX: number;
  deltaY: number;
  distanceX: number;
  distanceY: number;
}

/**
 * A directive to add drag-and-drop functionality to an HTML element.
 * It supports horizontal, vertical, or both-axis dragging.
 *
 * @example
 * <span appDragHandle [dragMode]="'horizontal'" [dragCursor]="'ew-resize'" (drag)="onElementDragged($event)">Drag Me</span>
 */
@Directive({
  selector: '[appDragHandle]'
})
export class DragHandleDirective implements OnDestroy {

  @Input() movementThreshold: number = 0;
  @Input() scale: number = 0.8;
  /**
   * Specifies the desired drag mode: 'horizontal', 'vertical', or 'both'.
   * Defaults to 'horizontal'.
   */
  @Input() dragMode: DragMode = 'horizontal';

  /**
   * Specifies the CSS cursor style to apply to the document body during dragging.
   * Defaults to 'grabbing'.
   */
  @Input() dragCursor: string = 'grabbing';

  /**
   * Emits `DragEventData` containing `deltaX` and `deltaY` when a drag movement occurs,
   * respecting the configured `dragMode`.
   */
  @Output() drag = new EventEmitter<DragEventData>();

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private currentSpanRef: HTMLElement | null = null;
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  private originalCursor: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  /**
   * Handles the `mousedown` event on the host element.
   * Initializes the drag operation, sets the cursor, and attaches global event listeners.
   * @param event The mouse event object.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault(); // Prevent default browser drag behavior (e.g., text selection)

    this.currentSpanRef = this.el.nativeElement;
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.originalCursor = document.body.style.cursor;
    this.renderer.setStyle(document.body, 'cursor', this.dragCursor);
    this.renderer.addClass(document.body, 'no-select'); // Add class to prevent text selection globally

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this));
  }

  /**
   * Handles the `mousemove` event on the document.
   * Calculates delta movements and emits the `drag` event if movement exceeds threshold
   * and matches the configured `dragMode`.
   * @param event The mouse event object.
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.currentSpanRef) {
      return;
    }
    const distanceX = event.clientX - this.startX;
    const distanceY = event.clientY - this.startY;
    const deltaX = event.movementX;
    const deltaY = event.movementY;

    let shouldEmit = Math.abs(deltaX) > this.movementThreshold || Math.abs(deltaY) > this.movementThreshold;
    if (!shouldEmit) return;
    const movement = { deltaX, deltaY, distanceX, distanceY };
    this.drag.emit(movement);

  }

  /**
   * Handles the `mouseup` event on the document.
   * Clears the dragging state, reverts the cursor, and removes global event listeners.
   */
  onMouseUp(): void {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.currentSpanRef = null;

    this.renderer.setStyle(document.body, 'cursor', this.originalCursor);
    this.renderer.removeClass(document.body, 'no-select');

    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
  }

  /**
   * Angular lifecycle hook called when the directive is destroyed.
   * Ensures all event listeners are cleaned up.
   */
  ngOnDestroy(): void {
    this.onMouseUp();
  }
}
