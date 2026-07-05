import {
  signal,
  inject,
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  AfterViewInit,
  Input,
  ElementRef,
} from '@angular/core';
import { EditorStateService } from '../../services/editor-state.service';
import { IAsset } from '../../interfaces/asset.interface';
import { AssetsExplorerService } from './assets-explorer.service';
import { AssetContextMenuComponent } from './components/asset-context-menu/asset-context-menu';
import { AssetCreateMenuComponent } from './components/asset-create-menu/asset-create-menu';
import { AssetGridComponent } from './components/asset-grid/asset-grid';
import { AssetTreeComponent } from './components/asset-tree/asset-tree';

@Component({
  selector: 'app-assets-explorer',
  standalone: true,
  imports: [
    AssetTreeComponent,
    AssetGridComponent,
    AssetContextMenuComponent,
    AssetCreateMenuComponent,
  ],
  templateUrl: './assets-explorer.component.html',
  styleUrls: ['./assets-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsExplorerComponent implements AfterViewInit {
  @Input() projectId?: string;

  private editorState = inject(EditorStateService);
  private elRef = inject(ElementRef);

  // Public service injection so the template can bind to its signals directly
  public explorerState = inject(AssetsExplorerService);

  private _projectId = this.editorState.activeProject;

  // Local UI State
  createMenuOpen = signal<boolean>(false);
  contextMenu = signal({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null as IAsset | null,
  });

  constructor() {
    effect(() => {
      if (this._projectId()) {
        this.refreshTree();
      }
    });
  }

  ngAfterViewInit(): void {
    this.refreshTree();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.contextMenu().visible) this.closeContextMenu();
    if (this.createMenuOpen()) this.createMenuOpen.set(false);
  }

  refreshTree() {
    const project = this._projectId();
    const id = this.projectId || project?.id;
    if (!id) return;
    this.explorerState.loadProjectAssets(id, project?.name).subscribe();
  }

  handleNodeSelection(node: IAsset) {
    this.explorerState.selectNode(node);
  }

  handleFolderActivation(node: IAsset) {
    this.explorerState.activateFolder(node);
  }

  openContextMenu(event: { e: MouseEvent; node: IAsset }) {
    event.e.preventDefault();
    event.e.stopPropagation();

    const containerRect = this.elRef.nativeElement.getBoundingClientRect();
    const menuWidth = 150;
    const menuHeight = 80;

    let x = event.e.clientX - containerRect.left;
    let y = event.e.clientY - containerRect.top;

    if (x + menuWidth > containerRect.width)
      x = containerRect.width - menuWidth;
    if (y + menuHeight > containerRect.height)
      y = containerRect.height - menuHeight;

    this.explorerState.selectedNodeId.set(event.node.id);
    this.contextMenu.set({ visible: true, x, y, targetNode: event.node });
  }

  closeContextMenu() {
    this.contextMenu.set({ visible: false, x: 0, y: 0, targetNode: null });
  }

  toggleCreateMenu(event: MouseEvent) {
    event.stopPropagation();
    this.createMenuOpen.update((v) => !v);
    this.closeContextMenu();
  }

  handleCreateAsset(actionType: string) {
    this.createMenuOpen.set(false);
    const project = this._projectId();
    if (!project) return;

    // Optional: Make the prompt context-aware based on the action
    const displayType = actionType.split('/').pop() || actionType;
    const name = prompt(`Enter ${displayType} name:`);
    if (!name) return;

    this.explorerState.createAsset(project.id, actionType, name)?.subscribe({
      next: () => this.refreshTree(),
      error: (err) => {
        console.error(`Error creating ${name}:`, err);
        alert('Failed to create asset.');
      },
    });
  }

  handleRenameAsset(newName: string) {
    const node = this.contextMenu().targetNode;
    const project = this._projectId();
    if (!node || !project || !newName || newName === node.name) return;

    this.explorerState
      .renameAsset(project.id, node, newName)
      .subscribe(() => this.refreshTree());
  }

  handleDeleteAsset(node: IAsset) {
    const project = this._projectId();
    if (!project) return;

    this.explorerState
      .deleteAsset(project.id, node)
      .subscribe(() => this.refreshTree());
  }
}
