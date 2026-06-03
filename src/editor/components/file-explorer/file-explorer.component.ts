import { Component, ChangeDetectionStrategy, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { FileSystemService } from './file-system.service';
import { FileNode, ContextMenuAction } from './file-explorer.model';
import { ContextMenuComponent, ContextMenuState } from '../context-menu/context-menu.component';

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [CommonModule, ContextMenuComponent],
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent {
  @Output() fileContentRequested = new EventEmitter<Observable<string>>();

  public directoryListing$: Observable<FileNode[]>;
  public activeFile: FileNode | null = null;

  public contextMenuState = signal<ContextMenuState>({
    isVisible: false,
    x: 0,
    y: 0,
    node: null,
    actions: [
      { id: 'new-file', label: 'New File' },
      { id: 'new-folder', label: 'New Folder' },
      { id: 'rename', label: 'Rename' },
      { id: 'delete', label: 'Delete' },
    ],
  });

  constructor(
    private fileSystemService: FileSystemService
  ) {
    this.directoryListing$ = this.fileSystemService.currentDirectory$;
  }

  onNodeClick(node: FileNode): void {
    if (node.type === 'file') {
      this.activeFile = node;
      const content$ = this.fileSystemService.getFileContent(node.path);
      this.fileContentRequested.emit(content$);
    }
  }

  onNodeDoubleClick(node: FileNode): void {
    if (node.type === 'directory') {
      this.activeFile = null;
      this.fileSystemService.navigateToDirectory(node.path);
    }
  }

  onContextMenu(event: MouseEvent, node: FileNode): void {
    event.preventDefault();
    this.contextMenuState.update(state => ({
      ...state,
      isVisible: true,
      x: event.clientX,
      y: event.clientY,
      node: node,
    }));
  }

  handleContextMenuAction(event: { action: ContextMenuAction; node: FileNode }): void {
    console.log(`Action: '${event.action.id}' on node:`, event.node);
    // Future: Implement logic for new-file, delete, rename etc.
  }
}