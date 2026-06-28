import { Directive, ElementRef, HostListener, Renderer2, Input, OnInit, OnDestroy, signal } from '@angular/core';

/**
 * @directive MovableDirective
 * @description
 * Makes the host HTML element draggable and/or resizable within the viewport.
 * The host element should have `position: absolute` or `fixed` for proper movement and resizing.
 *
 * Dragging is initiated by clicking and dragging on a specified child element (the "handle").
 * Resizing is initiated by clicking and dragging on another specified child element (the "resize handle").
 * If a `resizeHandleId` is not provided or the element isn't found, a default resize handle
 * with a Font Awesome icon will be automatically created and appended to the host element.
 *
 * @usage
 * ```html
 * <div appMovable
 * movableHandleId="my-header"
 * resizeHandleId="my-custom-resize-handle"
 * style="position: absolute; top: 100px; left: 100px; width: 300px; height: 200px;">
 * <header id="my-header">Drag Me</header>
 * <div id="my-custom-resize-handle" class="resize-handle"></div>
 * <div>Content</div>
 * </div>
 *
 * // Or, let the directive create the resize handle:
 * <div appMovable movableHandleId="my-header" style="position: absolute; ...">
 * <header id="my-header">Drag Me</header>
 * <div>Content</div>
 * </div>
 * ```
 * @dependency
 * Ensure Font Awesome CSS is included in your project for the default resize icon to render.
 */
@Directive({
  selector: '[appMovable]',
  standalone: true,
})
export class MovableDirective implements OnInit, OnDestroy {
  /**
   * The ID of the child element within the host that acts as the drag handle.
   * This input is required.
   */
  @Input({ required: true }) movableHandleId!: string;

  /**
   * The optional ID of the child element within the host that acts as the resize handle.
   * If not provided or the element with the given ID is not found,
   * a default resize handle will be created.
   */
  @Input() resizeHandleId?: string;
  @Input() showResize = true;

  private isDragging = signal(false);
  private startDragX = signal(0);
  private startDragY = signal(0);
  private translateX = signal(0);
  private translateY = signal(0);
  private dragHandleElement: HTMLElement | null = null;

  private isResizing = signal(false);
  private startResizeWidth = signal(0);
  private startResizeHeight = signal(0);
  private startResizeClientX = signal(0);
  private startResizeClientY = signal(0);
  private resizeHandleElement: HTMLElement | null = null;

  private animationFrameId: number | null = null;
  private lastMouseX = signal(0);
  private lastMouseY = signal(0);

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  /**
   * Initializes the directive. It finds the drag handle, sets up the resize handle (creating one if necessary),
   * and reads the initial transform state of the host element.
   */
  ngOnInit(): void {
    this.dragHandleElement = this.el.nativeElement.querySelector(`#${this.movableHandleId}`);
    if (!this.dragHandleElement) {
      console.error(`MovableDirective: Drag handle with ID "${this.movableHandleId}" not found. Dragging disabled.`);
    }

    let foundResizeHandle = false;
    if (this.resizeHandleId) {
      this.resizeHandleElement = this.el.nativeElement.querySelector(`#${this.resizeHandleId}`);
      if (this.resizeHandleElement) {
        foundResizeHandle = true;
      }
    }

    if (!foundResizeHandle && this.showResize) {
      const defaultResizeId = this.el.nativeElement.id
        ? `${this.el.nativeElement.id}-default-resize-handle`
        : `movable-resize-handle-${crypto.randomUUID()}`;

      const newResizeHandle = this.renderer.createElement('div');
      this.renderer.setAttribute(newResizeHandle, 'id', defaultResizeId);
      this.renderer.addClass(newResizeHandle, 'movable-resize-default-handle');
      this.renderer.setStyle(newResizeHandle, 'position', 'absolute');
      this.renderer.setStyle(newResizeHandle, 'bottom', '0');
      this.renderer.setStyle(newResizeHandle, 'right', '0');
      this.renderer.setStyle(newResizeHandle, 'width', '24px');
      this.renderer.setStyle(newResizeHandle, 'height', '24px');
      this.renderer.setStyle(newResizeHandle, 'background', 'rgba(0, 0, 0, 0.1)');
      this.renderer.setStyle(newResizeHandle, 'cursor', 'se-resize');
      this.renderer.setStyle(newResizeHandle, 'z-index', '20');
      this.renderer.setStyle(newResizeHandle, 'display', 'flex');
      this.renderer.setStyle(newResizeHandle, 'align-items', 'center');
      this.renderer.setStyle(newResizeHandle, 'justify-content', 'center');
      this.renderer.setStyle(newResizeHandle, 'transform', 'rotateZ(35)');
      this.renderer.setStyle(newResizeHandle, 'border-top-left-radius', '4px');

      const iconElement = this.renderer.createElement('i');
      this.renderer.addClass(iconElement, 'fa-solid');
      this.renderer.addClass(iconElement, 'fa-sort');
      this.renderer.addClass(iconElement, 'text-xs');
      this.renderer.setStyle(iconElement, 'color', 'rgba(230, 230, 230, 1)');
      this.renderer.appendChild(newResizeHandle, iconElement);

      this.renderer.appendChild(this.el.nativeElement, newResizeHandle);
      this.resizeHandleElement = newResizeHandle;
      this.resizeHandleId = defaultResizeId;
    }

    const computedStyle = window.getComputedStyle(this.el.nativeElement);
    const transformStyle = computedStyle.transform;

    if (transformStyle && transformStyle !== 'none') {
      if (transformStyle.startsWith('matrix3d')) {
        const matrix = transformStyle.split('(')[1].split(')')[0].split(',');
        this.translateX.set(parseFloat(matrix[12]));
        this.translateY.set(parseFloat(matrix[13]));
      } else if (transformStyle.startsWith('matrix')) {
        const matrix = transformStyle.split('(')[1].split(')')[0].split(',');
        this.translateX.set(parseFloat(matrix[4]));
        this.translateY.set(parseFloat(matrix[5]));
      } else if (transformStyle.includes('translate')) {
        const match = transformStyle.match(/translate(?:X|Y)?\(([^,)]+)px(?:, ([^,)]+)px)?\)/);
        if (match) {
          if (transformStyle.startsWith('translateX')) {
            this.translateX.set(parseFloat(match[1]));
          } else if (transformStyle.startsWith('translateY')) {
            this.translateY.set(parseFloat(match[1]));
          } else {
            this.translateX.set(parseFloat(match[1]));
            if (match[2]) {
              this.translateY.set(parseFloat(match[2]));
            }
          }
        }
      }
    }
  }

  /**
   * Cleans up resources when the directive is destroyed,
   * ensuring any pending animation frames are cancelled and cursor is reset.
   */
  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.setStyle(document.body, 'cursor', 'default');
  }

  /**
   * Handles the `mousedown` event on the host element.
   * Initiates either dragging or resizing based on the click location (handle vs. resize handle).
   * @param event The mouse event object.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const isClickOnResizeHandle = this.resizeHandleElement &&
                                  (event.target === this.resizeHandleElement || this.resizeHandleElement.contains(event.target as Node));

    if (isClickOnResizeHandle) {
      this.isResizing.set(true);
      const hostRect = this.el.nativeElement.getBoundingClientRect();
      this.startResizeWidth.set(hostRect.width);
      this.startResizeHeight.set(hostRect.height);
      this.startResizeClientX.set(event.clientX);
      this.startResizeClientY.set(event.clientY);
      event.preventDefault();
      this.renderer.addClass(this.el.nativeElement, 'resizing');
      this.renderer.setStyle(document.body, 'cursor', 'se-resize');
    } else if (this.dragHandleElement && (event.target === this.dragHandleElement || this.dragHandleElement.contains(event.target as Node))) {
      this.isDragging.set(true);
      this.startDragX.set(event.clientX - this.translateX());
      this.startDragY.set(event.clientY - this.translateY());
      event.preventDefault();
      this.renderer.addClass(this.el.nativeElement, 'dragging');
      this.renderer.setStyle(document.body, 'cursor', 'grabbing');
    }
  }

  /**
   * Handles the `mousemove` event on the document.
   * Updates the position (for dragging) or size (for resizing) via `requestAnimationFrame`
   * to ensure smooth, flicker-free updates and clamping within viewport bounds.
   * @param event The mouse event object.
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging() && !this.isResizing()) {
      return;
    }

    this.lastMouseX.set(event.clientX);
    this.lastMouseY.set(event.clientY);

    if (this.animationFrameId) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      if (this.isDragging()) {
        let newTranslateX = this.lastMouseX() - this.startDragX();
        let newTranslateY = this.lastMouseY() - this.startDragY();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const hostElementWidth = this.el.nativeElement.offsetWidth;
        const hostElementHeight = this.el.nativeElement.offsetHeight;

        const minX = 0;
        const minY = 0;
        const maxX = viewportWidth - hostElementWidth;
        const maxY = viewportHeight - hostElementHeight;

        this.translateX.set(Math.max(minX, Math.min(newTranslateX, maxX)));
        this.translateY.set(Math.max(minY, Math.min(newTranslateY, maxY)));

        this.renderer.setStyle(
          this.el.nativeElement,
          'transform',
          `translate(${this.translateX()}px, ${this.translateY()}px)`
        );
      } else if (this.isResizing()) {
        const newWidth = this.startResizeWidth() + (this.lastMouseX() - this.startResizeClientX());
        const newHeight = this.startResizeHeight() + (this.lastMouseY() - this.startResizeClientY());

        const minWidth = 150;
        const minHeight = 100;

        this.renderer.setStyle(this.el.nativeElement, 'width', `${Math.max(newWidth, minWidth)}px`);
        this.renderer.setStyle(this.el.nativeElement, 'height', `${Math.max(newHeight, minHeight)}px`);
      }

      this.animationFrameId = null;
    });
  }

  /**
   * Handles the `mouseup` event on the document.
   * Stops any active dragging or resizing operation and resets the cursor.
   */
  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isDragging() || this.isResizing()) {
      this.isDragging.set(false);
      this.isResizing.set(false);
      this.renderer.removeClass(this.el.nativeElement, 'dragging');
      this.renderer.removeClass(this.el.nativeElement, 'resizing');
      this.renderer.setStyle(document.body, 'cursor', 'default');

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  /**
   * Handles the `contextmenu` event.
   * Prevents the browser's default context menu from appearing when right-clicking on the drag or resize handle.
   * @param event The mouse event object.
   */
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    const isClickOnHandle = (this.dragHandleElement && (event.target === this.dragHandleElement || this.dragHandleElement.contains(event.target as Node)));
    const isClickOnResizeHandle = (this.resizeHandleElement && (event.target === this.resizeHandleElement || this.resizeHandleElement.contains(event.target as Node)));

    if (isClickOnHandle || isClickOnResizeHandle) {
      event.preventDefault();
    }
  }

  /**
   * Handles the `mousemove` event on the host element.
   * Sets the appropriate cursor style ('se-resize' for resize handle, 'grab' for drag handle)
   * when hovering over the respective interactive areas.
   * @param event The mouse event object.
   */
  @HostListener('mousemove', ['$event'])
  onHoverMouseMove(event: MouseEvent): void {
    if (this.isDragging() || this.isResizing()) {
      return;
    }

    const isHoveringResizeHandle = this.resizeHandleElement &&
                                   (event.target === this.resizeHandleElement || this.resizeHandleElement.contains(event.target as Node));
    const isHoveringDragHandle = this.dragHandleElement &&
                                 (event.target === this.dragHandleElement || this.dragHandleElement.contains(event.target as Node));


    if (isHoveringResizeHandle) {
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'se-resize');
    } else if (isHoveringDragHandle) {
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');
    }
  }
}
