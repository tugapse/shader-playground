import { Directive, ElementRef, HostListener, Output, EventEmitter, Renderer2, OnDestroy, Input } from '@angular/core';

/**
 * Defines the possible modes for the drag directive.
 * - 'horizontal': Allows dragging only along the X-axis.
 * - 'vertical': Allows dragging only along the Y-axis.
 * - 'both': Allows dragging along both X and Y axes.
 */
export type DragMode = 'horizontal' | 'vertical' | 'both';

/**
 * Interface for the data emitted by the `drag` event.
 * Contains information about the change in mouse position.
 */
export interface DragEventData {
  /** The change in X-coordinate since the last `mousemove` event. */
  deltaX: number;
  /** The change in Y-coordinate since the last `mousemove` event. */
  deltaY: number;
  /** The total distance moved along the X-axis from the start of the drag. */
  distanceX: number;
  /** The total distance moved along the Y-axis from the start of the drag. */
  distanceY: number;
}

/**
 * @directive DragHandleDirective
 * @description
 * A directive to add drag-and-drop functionality to an HTML element.
 * It allows dragging an element along horizontal, vertical, or both axes.
 * This directive is intended to be applied to a "handle" element, which then emits
 * drag events, allowing a parent component to move or modify another element.
 *
 * @example
 * ```html
 * <div #draggableElement style="position: relative;">
 * <span appDragHandle [dragMode]="'both'" [dragCursor]="'grab'" (drag)="onElementDragged($event, draggableElement)">
 * Drag Me
 * </span>
 * </div>
 * ```
 */
@Directive({
  selector: '[appDragHandle]'
})
export class DragHandleDirective implements OnDestroy {

  /**
   * The minimum pixel movement required in either X or Y direction before a `drag` event is emitted.
   * Defaults to 0.
   */
  @Input() movementThreshold: number = 0;

  /**
   * This input isn't currently used in the directive's logic.
   * Consider removing or implementing functionality if needed.
   */
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
   * Emits `DragEventData` containing `deltaX`, `deltaY`, `distanceX`, and `distanceY`
   * when a drag movement occurs, respecting the configured `dragMode` and `movementThreshold`.
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
   * Initializes the drag operation, sets the cursor, and attaches global event listeners
   * for `mousemove` and `mouseup`. Prevents default browser drag behavior.
   * @param event The mouse event object.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();

    this.currentSpanRef = this.el.nativeElement;
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.originalCursor = document.body.style.cursor;
    this.renderer.setStyle(document.body, 'cursor', this.dragCursor);
    // Add class to prevent text selection globally during drag
    this.renderer.addClass(document.body, 'no-select');

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this));
  }

  /**
   * Handles the `mousemove` event on the document.
   * Calculates delta and distance movements, then emits the `drag` event if
   * movement exceeds `movementThreshold` and matches the `dragMode`.
   * @param event The mouse event object.
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.currentSpanRef) {
      return;
    }

    let deltaX = event.movementX;
    let deltaY = event.movementY;

    // Apply dragMode restrictions
    if (this.dragMode === 'horizontal') {
      deltaY = 0;
    } else if (this.dragMode === 'vertical') {
      deltaX = 0;
    }

    // Only emit if movement exceeds threshold
    const shouldEmit = Math.abs(deltaX) > this.movementThreshold || Math.abs(deltaY) > this.movementThreshold;
    if (!shouldEmit) {
      return;
    }

    const distanceX = event.clientX - this.startX;
    const distanceY = event.clientY - this.startY;

    const movement = { deltaX, deltaY, distanceX, distanceY };
    this.drag.emit(movement);
  }

  /**
   * Handles the `mouseup` event on the document.
   * Clears the dragging state, reverts the document body cursor, removes the 'no-select' class,
   * and detaches global event listeners.
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
   * Ensures all event listeners are properly cleaned up by calling `onMouseUp()`.
   */
  ngOnDestroy(): void {
    this.onMouseUp();
  }
}
