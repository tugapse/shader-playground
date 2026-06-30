import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorService } from '@editor/services/editor.service';

@Component({
  selector: 'workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.html',
  styleUrls: ['./workspace.scss'],
})
export class WorkspaceComponent {
  @Input() showLeft = true;
  @Input() showRight = true;
  @Input() showFooter = true;

  leftWidth = 250;
  rightWidth = 250;
  footerHeight = 200;

  private resizing: 'left' | 'right' | 'footer' | null = null;

  // Track starting mouse coordinates and initial sizes
  private startX = 0;
  private startY = 0;
  private startLeftWidth = 0;
  private startRightWidth = 0;
  private startFooterHeight = 0;

  constructor(private editorService: EditorService) {}

  startResize(panel: 'left' | 'right' | 'footer', event: MouseEvent) {
    event.preventDefault();
    this.resizing = panel;

    // Capture starting state
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeftWidth = this.leftWidth;
    this.startRightWidth = this.rightWidth;
    this.startFooterHeight = this.footerHeight;

    document.body.style.cursor = panel === 'footer' ? 'ns-resize' : 'ew-resize';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;

    // Calculate how far the mouse has moved from the initial click point
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    if (this.resizing === 'left') {
      // Moving right increases left width
      this.leftWidth = Math.max(50, this.startLeftWidth + deltaX);
    } else if (this.resizing === 'right') {
      // Moving left increases right width (hence subtracting deltaX)
      this.rightWidth = Math.max(50, this.startRightWidth - deltaX);
    } else if (this.resizing === 'footer') {
      // Moving up increases footer height (hence subtracting deltaY)
      this.footerHeight = Math.max(50, this.startFooterHeight - deltaY);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.resizing) {
      this.resizing = null;
      document.body.style.cursor = 'default';
      this.editorService.requestCanvasResize();
    }
  }
}
