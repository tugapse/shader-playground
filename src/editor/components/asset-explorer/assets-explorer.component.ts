import { NgTemplateOutlet } from '@angular/common';
import { signal, inject, ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { EditorStateService } from '../../services/editor-state.service';
import { IAsset } from '../../interfaces/asset.interface';
import { AssetService } from '../../../app/api/services/asset.service';
import { map } from 'rxjs';
import { AssetResponse } from '../../../app/api/models/omega-api.models';

@Component({
  selector: 'app-assets-exporer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './assets-explorer.component.html',
  styleUrl: './assets-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileExplorerLogic {
  private assetService = inject(AssetService);
  private editorState = inject(EditorStateService);

  projectId = this.editorState.activeProject;

  treeData = signal<IAsset | null>(null);
  selectedNodeId = signal<string | null>(null);
  expandedNodes = signal<Set<string>>(new Set<string>());

  constructor() {
    effect(() => {
      const project = this.projectId();
      if (project && this.editorState.centralView() === 'assets') {
        this.refreshTree();
      }
    });
  }

  refreshTree() {
    const project = this.projectId();
    if (!project) return;
    this.assetService.listAssets(project.id).pipe(
      map(response => this.buildAssetTree(response.assets, { id: project.id, name: project.name }))
    ).subscribe(tree => {
      this.treeData.set(tree);
      // Ensure root is expanded
      if(tree){
        this.expandedNodes.update(current => {
          const newSet = new Set(current);
          newSet.add(tree.id);
          return newSet;
        });
      }
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
    if (!newName || newName === node.name) return;

    const pathParts = node.virtualPath.split('/');
    pathParts.pop(); // remove old name
    const newVirtualPath = [...pathParts, newName].join('/');

    const project = this.projectId();
    if (!project) return;

    this.assetService.updateAsset(project.id, node.id, { virtual_path: newVirtualPath }).subscribe(() => {
      this.refreshTree();
    });
  }

  deleteAsset(node: IAsset) {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      const project = this.projectId();
      if (!project) return;

      this.assetService.deleteAsset(project.id, node.id).subscribe(() => {
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

  private buildAssetTree(assets: AssetResponse[], project: { id: string, name: string }): IAsset {
    const root: IAsset = {
      id: project.id,
      name: project.name,
      type: 'project',
      virtualPath: '',
      projectId: project.id,
      children: []
    };

    const nodeMap = new Map<string, IAsset>();
    nodeMap.set('', root); // Root is identified by an empty path

    // Sort assets by path depth to ensure parents are created before children
    assets.sort((a, b) => a.virtual_path.split('/').length - b.virtual_path.split('/').length);

    assets.forEach(asset => {
      const pathParts = asset.virtual_path.split('/');
      let parent = root;
      let currentPath = '';

      // Find or create folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        let childNode = nodeMap.get(currentPath);
        if (!childNode) {
          childNode = {
            id: currentPath, // Use path as ID for folders
            name: part,
            type: 'folder',
            virtualPath: currentPath,
            projectId: project.id,
            children: []
          };
          nodeMap.set(currentPath, childNode);
          parent.children!.push(childNode);
        }
        parent = childNode;
      }

      // Create file node
      const fileNode: IAsset = {
        id: asset.id,
        name: asset.filename,
        type: this.mapAssetType(asset.asset_type),
        virtualPath: asset.virtual_path,
        projectId: project.id
      };
      parent.children!.push(fileNode);
      nodeMap.set(asset.virtual_path, fileNode);
    });

    // Sort all children recursively
    const sortChildren = (node: IAsset) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if ((a.type === 'folder' || a.type === 'project') && b.type !== 'folder' && b.type !== 'project') return -1;
          if ((b.type === 'folder' || b.type === 'project') && a.type !== 'folder' && a.type !== 'project') return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };

    sortChildren(root);
    return root;
  }

  private mapAssetType(type: 'code' | 'image' | 'audio' | 'text' | 'raw'): 'file' | string {
    // This can be expanded if specific icons/logic are needed per type
    return 'file';
  }
}