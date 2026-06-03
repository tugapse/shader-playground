import { Component, ChangeDetectionStrategy, signal, HostListener, ElementRef, Output, EventEmitter, input, effect, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileNode, ContextMenuAction } from '../file-explorer/file-explorer.model';

export interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
  node: FileNode | null;
  actions: ContextMenuAction[];
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent {
  readonly state = model.required<ContextMenuState>();

  @Output() actionExecuted = new EventEmitter<{ action: ContextMenuAction; node: FileNode }>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.state().isVisible) {
      return;
    }
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.close();
    }
  }

  onActionClick(event: MouseEvent, action: ContextMenuAction): void {
    event.stopPropagation();
    const currentState = this.state();
    if (currentState.node) {
      this.actionExecuted.emit({ action, node: currentState.node });
    }
    this.close();
  }

  private close(): void {
    this.state.update(state => ({ ...state, isVisible: false }));
  }
}