import { NgComponentOutlet } from '@angular/common';
import { Component, HostListener, Input, Type } from '@angular/core';
import { MovableDirective } from '@editor/directives/moveable.directive';
import { WindowService } from '@editor/services/window.service';
import { Icon } from 'src/app/components/icon/icon';

@Component({
  selector: 'editor-window',
  imports: [MovableDirective, Icon, NgComponentOutlet],
  templateUrl: './window.html',
  styleUrl: './window.scss',
})
export class AssetExplorerWindow {
  @Input() windowId!: string;
  @Input() windowtitle = '';
  @Input() windowIconName = '';
  @Input() windowFooter = '';
  @Input() childComponentType!: Type<any>;
  @Input() childInputs?: Record<string, unknown>;
  @Input() isActive = false;
  @Input() isMaximized = false;

  constructor(private windowService: WindowService) {}

  @HostListener('mousedown')
  onWindowClick() {
    this.windowService.focus(this.windowId);
  }
  closeWindow() {
    this.windowService.close(this.windowId);
  }
}
