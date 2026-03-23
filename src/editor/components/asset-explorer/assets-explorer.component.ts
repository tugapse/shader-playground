import { NgTemplateOutlet } from '@angular/common';
import { signal, inject, input, ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { AssetApiService } from '../../api/assets.service';
import { EditorStateService } from '../../services/editor-state.service';
import { IAsset } from '../../interfaces/asset.interface';

@Component({
  selector: 'app-assets-exporer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './assets-explorer.component.html',
  styleUrl: './assets-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileExplorerLogic {
  private assetApi = inject(AssetApiService);
  private editorState = inject(EditorStateService);

  projectId = this.editorState.activeProject;

  treeData = signal<IAsset | null>(null);
  selectedNodeId = signal<string | null>(null);
  expandedNodes = signal<Set<string>>(new Set<string>());

  constructor() {
    effect(() => {
      const project = this.projectId();
      if (project) {
        this.refreshTree();
      }
    });
  }

  refreshTree() {
    const project = this.projectId();
    if (!project) return;
    this.assetApi.getProjectTree(project.id).subscribe(data => {
      this.treeData.set(data);
    });
  }

  handleNodeClick(node: IAsset) {
    if (node.type === 'folder' || node.type === 'project') {
      this.toggleExpand(node);
    } else {
      this.selectedNodeId.set(node.id);
      this.editorState.setSelectedAsset(node);
    }
  }

  renameAsset(node: IAsset) {
    const newName = prompt('Enter new name:', node.name);
    if (newName && newName !== node.name) {
      this.assetApi.updateMetadata(node.id, { name: newName }).subscribe(() => {
        this.refreshTree();
      });
    }
  }

  deleteAsset(node: IAsset) {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      this.assetApi.deleteAsset(node.id).subscribe(() => {
        if (this.editorState.selectedAsset()?.id === node.id) {
          this.editorState.setSelectedAsset(null);
        }
        this.refreshTree();
      });
    }
  }

  private toggleExpand(node: IAsset) {
    const key = node.id || node.name;
    const current = new Set(this.expandedNodes());
    current.has(key) ? current.delete(key) : current.add(key);
    this.expandedNodes.set(current);
  }

  isExpanded(node: IAsset): boolean {
    return this.expandedNodes().has(node.id || node.name);
  }
}
