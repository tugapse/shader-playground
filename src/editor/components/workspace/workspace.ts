import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorService } from '@editor/services/editor.service';

@Component({
  selector: 'workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.html',
  styleUrls: ['./workspace.scss']
})
export class WorkspaceComponent {
  @Input() showLeft = true;
  @Input() showRight = true;
  @Input() showFooter = true;

  leftWidth = 250;
  rightWidth = 250;
  footerHeight = 200;
  constructor(private editorService: EditorService) {}
  

  private resizing: 'left' | 'right' | 'footer' | null = null;

  startResize(panel: 'left' | 'right' | 'footer', event: MouseEvent) {
    event.preventDefault();
    this.resizing = panel;
    document.body.style.cursor = panel === 'footer' ? 'ns-resize' : 'ew-resize';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;

    // Constrains resizing to ensure panels don't collapse below 50px or exceed viewport bounds
    if (this.resizing === 'left') {
      this.leftWidth = Math.max(50, event.clientX);
    } else if (this.resizing === 'right') {
      this.rightWidth = Math.max(50, window.innerWidth - event.clientX);
    } else if (this.resizing === 'footer') {
      this.footerHeight = Math.max(50, window.innerHeight - event.clientY);
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