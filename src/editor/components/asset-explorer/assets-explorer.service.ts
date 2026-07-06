import { inject, Injectable, signal } from '@angular/core';
import { IAsset } from '../../interfaces/asset.interface';
import { AssetService } from '../../../app/api/services/asset.service';
import { EditorStateService } from '../../services/editor-state.service';
import { AssetResponse } from '../../../app/api/models/omega-api.models';
import { map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetsExplorerService {
  private assetService = inject(AssetService);
  private editorState = inject(EditorStateService);

  // Core State Signals
  readonly treeData = signal<IAsset | null>(null);
  readonly selectedNodeId = signal<string | null>(null);
  readonly expandedNodes = signal<Set<string>>(new Set<string>());
  readonly activeFolder = signal<IAsset | null>(null);

  loadProjectAssets(projectId: string, projectName: string = 'Project Root') {
    return this.assetService.listAssets(projectId).pipe(
      map((response) =>
        this.buildAssetTree(response.assets, {
          id: projectId,
          name: projectName,
        }),
      ),
      tap((tree) => {
        this.treeData.set(tree);
        if (tree) {
          const currentPath = this.activeFolder()?.virtualPath;
          const reSyncedFolder = currentPath
            ? this.findNodeByPath(tree, currentPath)
            : null;

          this.activeFolder.set(reSyncedFolder || tree);
          this.expandedNodes.update((current) => new Set(current).add(tree.id));
        }
      }),
    );
  }

  selectNode(node: IAsset) {
    if (node.type === 'folder' || node.type === 'project') {
      this.toggleExpand(node);
      this.activeFolder.set(node);
    } else {
      this.selectedNodeId.set(node.id);
      this.editorState.setSelectedAsset(node);
    }
  }

  activateFolder(node: IAsset) {
    if (node.type === 'folder' || node.type === 'project') {
      this.activeFolder.set(node);
      this.expandedNodes.update((current) =>
        new Set(current).add(node.id || node.name),
      );
    }
  }

  toggleExpand(node: IAsset) {
    const key = node.id || node.name;
    this.expandedNodes.update((current) => {
      const updated = new Set(current);
      updated.has(key) ? updated.delete(key) : updated.add(key);
      return updated;
    });
  }

  createAsset(projectId: string, actionType: string, name: string) {
    const targetFolder = this.activeFolder();
    const basePath = targetFolder?.virtualPath
      ? `${targetFolder.virtualPath}/`
      : '';
    const fullVirtualPath = `${basePath}${name}`;

    let fileName = name;
    let content = '';
    let mimeType = 'text/plain';
    let assetType = 'raw';

    switch (actionType) {
      case 'scene':
        fileName = name.endsWith('.scene') ? name : `${name}.scene`;
        content = JSON.stringify({ entities: [] }, null, 2);
        mimeType = 'application/json';
        assetType = 'scene';
        break;

      case 'code':
        // 🎯 Fixed: Aligned configuration to use valid engine TypeScript templates
        fileName = name.endsWith('.ts') ? name : `${name}.ts`;
        content = `import { EngineBehavior } from 'omega-game-engine';\n\nexport class CustomBehavior extends EngineBehavior {\n    start() {}\n    update(dt: number) {}\n}\n`;
        mimeType = 'text/plain';
        assetType = 'code';
        break;

      case 'material/color':
      case 'material/unlit':
      case 'material/standard':
        fileName = name.endsWith('.mat') ? name : `${name}.mat`;
        const shaderType = actionType.split('/')[1];
        content = JSON.stringify(
          {
            shader: shaderType.charAt(0).toUpperCase() + shaderType.slice(1),
            properties: shaderType === 'color' ? { color: '#ffffff' } : {},
          },
          null,
          2,
        );
        mimeType = 'application/json';
        break;

      case 'texture/2d':
      case 'texture/shadowmap':
        fileName = name.endsWith('.tex') ? name : `${name}.tex`;
        content = JSON.stringify(
          {
            type: actionType.split('/')[1],
            filterMode: 'Bilinear',
            wrapMode: 'Repeat',
          },
          null,
          2,
        );
        mimeType = 'application/json';
        break;

      case 'entity/empty':
      case 'entity/skybox':
        fileName = name.endsWith('.ent') ? name : `${name}.ent`;
        content = JSON.stringify(
          {
            name: name,
            components: actionType.includes('skybox')
              ? ['Transform', 'SkyboxRenderer']
              : ['Transform'],
          },
          null,
          2,
        );
        mimeType = 'application/json';
        break;

      case 'folder':
        console.log(
          `Requires backend support to create empty directory at: ${fullVirtualPath}`,
        );
        return null;

      default:
        console.warn(`Unknown action type: ${actionType}`);
        return null;
    }

    const file = new File([content], fileName, { type: mimeType });
    return this.assetService.uploadAsset(
      projectId,
      file,
      fileName,
      assetType as any,
    );
  }

  renameAsset(projectId: string, node: IAsset, newName: string) {
    const pathParts = node.virtualPath.split('/');
    pathParts.pop();
    const newVirtualPath = [...pathParts, newName].join('/');
    return this.assetService.updateAsset(projectId, node.id, {
      virtual_path: newVirtualPath,
    });
  }

  deleteAsset(projectId: string, node: IAsset) {
    return this.assetService.deleteAsset(projectId, node.id).pipe(
      tap(() => {
        if (this.editorState.selectedAsset()?.id === node.id) {
          this.editorState.setSelectedAsset(null);
        }
        if (this.activeFolder()?.id === node.id) {
          this.activeFolder.set(this.treeData());
        }
      }),
    );
  }

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

  private buildAssetTree(
    assets: AssetResponse[],
    project: { id: string; name: string },
  ): IAsset {
    const root: IAsset = {
      id: project.id,
      name: project.name,
      type: 'project',
      virtualPath: '',
      projectId: project.id,
      children: [],
    };

    const nodeMap = new Map<string, IAsset>();
    nodeMap.set('', root);

    assets.sort(
      (a, b) =>
        a.virtualPath.split('/').length - b.virtualPath.split('/').length,
    );

    assets.forEach((asset) => {
      const pathParts = asset.virtualPath.split('/');
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
            children: [],
          };
          nodeMap.set(currentPath, childNode);
          parent.children!.push(childNode);
        }
        parent = childNode;
      }

      const fileNode: IAsset = {
        id: asset.id,
        name: asset.filename,
        type: asset.assetType,
        virtualPath: asset.virtualPath,
        projectId: project.id,
      };

      parent.children!.push(fileNode);
      nodeMap.set(asset.virtualPath, fileNode);
    });

    const sortChildren = (node: IAsset) => {
      if (node.children) {
        node.children.sort((a, b) => {
          const aIsFolder = a.type === 'folder' || a.type === 'project';
          const bIsFolder = b.type === 'folder' || b.type === 'project';
          if (aIsFolder && !bIsFolder) return -1;
          if (bIsFolder && !aIsFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };

    sortChildren(root);
    return root;
  }
}
