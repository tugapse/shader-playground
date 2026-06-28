import { NgTemplateOutlet } from '@angular/common';
import { signal, inject, ChangeDetectionStrategy, Component, effect, HostListener } from '@angular/core';
import { EditorStateService } from '../../services/editor-state.service';
import { IAsset } from '../../interfaces/asset.interface';
import { AssetService } from '../../../app/api/services/asset.service';
import { map } from 'rxjs';
import { AssetResponse } from '../../../app/api/models/omega-api.models';

@Component({
  selector: 'app-assets-explorer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './assets-explorer.component.html',
  styleUrl: './assets-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsExplorerComponent {
  private assetService = inject(AssetService);
  private editorState = inject(EditorStateService);

  projectId = this.editorState.activeProject;

  treeData = signal<IAsset | null>(null);
  selectedNodeId = signal<string | null>(null);
  expandedNodes = signal<Set<string>>(new Set<string>());
  activeFolder = signal<IAsset | null>(null);
  createMenuOpen = signal<boolean>(false);
  
  contextMenu = signal({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null as IAsset | null
  });

  constructor() {
    effect(() => {
      const project = this.projectId();
      if (project && this.editorState.centralView() === 'assets') {
        this.refreshTree();
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.contextMenu().visible) {
      this.closeContextMenu();
    }
    if (this.createMenuOpen()) {
      this.createMenuOpen.set(false);
    }
  }

  toggleCreateMenu(event: MouseEvent) {
    event.stopPropagation();
    this.createMenuOpen.update(v => !v);
    if (this.contextMenu().visible) this.closeContextMenu();
  }

  createNewAsset(type: 'folder' | 'scene' | 'code' | 'material') {
    this.createMenuOpen.set(false);
    
    const project = this.projectId();
    if (!project) return;

    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    const targetFolder = this.activeFolder();
    const basePath = targetFolder?.virtualPath ? `${targetFolder.virtualPath}/` : '';
    const fullVirtualPath = `${basePath}${name}`;

    switch(type) {
      case 'scene': {
        const fileName = name.endsWith('.scene') ? name : `${name}.scene`;
        const content = JSON.stringify({ entities: [] }, null, 2);
        this.uploadVirtualAsset(project.id, fileName, content, 'application/json', 'scene');
        break;
      }
      case 'code': {
        const fileName = name.endsWith('.py') ? name : `${name}.py`;
        const content = '# Sentinel Script\n';
        this.uploadVirtualAsset(project.id, fileName, content, 'text/plain', 'code');
        break;
      }
      case 'material': {
        const fileName = name.endsWith('.mat') ? name : `${name}.mat`;
        const content = JSON.stringify({ shader: 'Standard', properties: {} }, null, 2);
        this.uploadVirtualAsset(project.id, fileName, content, 'application/json', 'raw');
        break;
      }
      case 'folder': {
        console.log(`Requires backend support to create empty directory at: ${fullVirtualPath}`);
        break;
      }
    }
  }

  private uploadVirtualAsset(projectId: string, fileName: string, content: string, mimeType: string, assetType: string) {
    const file = new File([content], fileName, { type: mimeType });
    this.assetService.uploadAsset(projectId, file, fileName, assetType as any).subscribe({
      next: () => this.refreshTree(),
      error: (err) => {
        console.error(`Error creating ${fileName}:`, err);
        alert('Failed to create asset.');
      }
    });
  }

  refreshTree() {
    const project = this.projectId();
    if (!project) return;
    
    this.assetService.listAssets(project.id).pipe(
      map(response => this.buildAssetTree(response.assets, { 
        id: project.id, 
        name: project.name || 'Project Root' 
      }))
    ).subscribe(tree => {
      this.treeData.set(tree);
      
      if(tree) {
        if (this.activeFolder()) {
          const currentPath = this.activeFolder()!.virtualPath;
          const reSyncedFolder = this.findNodeByPath(tree, currentPath);
          this.activeFolder.set(reSyncedFolder || tree);
        } else {
          this.activeFolder.set(tree);
        }

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
      this.activeFolder.set(node);
    } else {
      this.selectedNodeId.set(node.id);
      this.editorState.setSelectedAsset(node);
    }
  }

  handleGridItemClick(item: IAsset) {
    this.selectedNodeId.set(item.id);
    if (item.type !== 'folder' && item.type !== 'project') {
      this.editorState.setSelectedAsset(item);
    }
  }

  handleGridItemDoubleClick(item: IAsset) {
    if (item.type === 'folder' || item.type === 'project') {
      this.activeFolder.set(item);
      
      const current = new Set(this.expandedNodes());
      current.add(item.id || item.name);
      this.expandedNodes.set(current);
    }
  }

  getBreadcrumbPath(node: IAsset): string {
    if (node.type === 'project') return node.name;
    const project = this.projectId();
    const rootName = project ? project.name : 'Assets';
    return `${rootName} > ${node.virtualPath.replace(/\//g, ' > ')}`;
  }

  onContextMenu(event: MouseEvent, node: IAsset) {
    event.preventDefault();
    event.stopPropagation();

    const menuWidth = 150; 
    const menuHeight = 80; 
    const x = Math.min(event.clientX, window.innerWidth - menuWidth);
    const y = Math.min(event.clientY, window.innerHeight - menuHeight);

    this.selectedNodeId.set(node.id);

    this.contextMenu.set({
      visible: true,
      x,
      y,
      targetNode: node
    });
  }

  closeContextMenu() {
    this.contextMenu.set({ visible: false, x: 0, y: 0, targetNode: null });
  }

  renameAsset() {
    const node = this.contextMenu().targetNode;
    if (!node) return;

    const newName = prompt('Enter new name:', node.name);
    this.closeContextMenu();
    if (!newName || newName === node.name) return;

    const pathParts = node.virtualPath.split('/');
    pathParts.pop(); 
    const newVirtualPath = [...pathParts, newName].join('/');

    const project = this.projectId();
    if (!project) return;

    this.assetService.updateAsset(project.id, node.id, { virtual_path: newVirtualPath }).subscribe(() => {
      this.refreshTree();
    });
  }

  deleteAsset() {
    const node = this.contextMenu().targetNode;
    if (!node) return;

    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      const project = this.projectId();
      if (!project) return;

      this.assetService.deleteAsset(project.id, node.id).subscribe(() => {
        if (this.editorState.selectedAsset()?.id === node.id) {
          this.editorState.setSelectedAsset(null);
        }
        
        if (this.activeFolder()?.id === node.id) {
          this.activeFolder.set(this.treeData());
        }
        
        this.refreshTree();
      });
    }
    this.closeContextMenu();
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

  // Parses tree structure and restricts deep search to folder nodes to preserve performance
  private findNodeByPath(root: IAsset, path: string): IAsset | null {
    if (root.virtualPath === path) return root;
    if (root.children) {
      for (const child of root.children) {
        if (child.type === 'folder' || child.type === 'project') {
          const found = this.findNodeByPath(child, path);
          if (found) return found;
        }
      }
    }
    return null;
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
    nodeMap.set('', root); 

    assets.sort((a, b) => a.virtual_path.split('/').length - b.virtual_path.split('/').length);

    assets.forEach(asset => {
      const pathParts = asset.virtual_path.split('/');
      let parent = root;
      let currentPath = '';

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        let childNode = nodeMap.get(currentPath);
        if (!childNode) {
          childNode = {
            id: currentPath,
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

  private mapAssetType(type: 'code' | 'image' | 'audio' | 'text' | 'raw' | 'scene'): string {
    return type;
  }
}