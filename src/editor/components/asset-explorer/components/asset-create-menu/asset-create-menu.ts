import {
  Component,
  ChangeDetectionStrategy,
  output,
  OnInit,
  AfterViewInit,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ObjectInstanciator } from 'omega-game-engine';
import { AssetsExplorerService } from '../../assets-explorer.service';
import { IAsset } from '@editor/interfaces/asset.interface';

export interface IMenuAction {
  label: string;
  icon?: string;
  action?: string;
  children?: IMenuAction[];
}

@Component({
  selector: 'app-asset-create-menu',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './asset-create-menu.html',
  styleUrls: ['./asset-create-menu.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetCreateMenuComponent implements AfterViewInit {
  create = output<string>();
  assetsService = inject(AssetsExplorerService);

  menuData!: IAsset;

  ngAfterViewInit(): void {
    const hiddenTypes = [
      'EntityBehaviour',
      'RenderBehaviour',
      'Transform',
      'Light',
    ];
    const data = ObjectInstanciator.getMetadata().filter(
      (item) => !hiddenTypes.includes(item.type),
    );

    const pathMapped = data.reduce((acc: any, item: any) => {
      item['virtualPath'] = item.path;
      if (!acc[item.path]) {
        acc[item.path] = [];
      }
      acc[item.path].push(item);
      return acc;
    }, {});
    console.log(pathMapped);

    const types = data.map((item) => item.type);
    for (const type of types) {
      console.log(type);
    }
    const item = this.buildAssetTree(pathMapped, {
      id: 'root',
      name: 'Project Root',
    });
    this.menuData = item;
    console.log(item, data);
  }

  handleAction(event: MouseEvent, action?: string) {
    event.stopPropagation();
    if (action) {
      this.create.emit(action);
    }
  }

  private buildAssetTree(
    data: Record<string, any[]>,
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

    // Helper to ensure a folder path exists in the tree hierarchy
    const ensureFolder = (folderPath: string): IAsset => {
      if (nodeMap.has(folderPath)) {
        return nodeMap.get(folderPath)!;
      }

      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');

      // Recursively get or create parent folder
      const parentNode = ensureFolder(parentPath);

      const newFolder: IAsset = {
        id: folderPath,
        name: folderName,
        type: 'folder',
        virtualPath: folderPath,
        projectId: project.id,
        children: [],
      };

      nodeMap.set(folderPath, newFolder);
      parentNode.children!.push(newFolder);
      return newFolder;
    };

    // Process each path category and its items
    Object.entries(data).forEach(([pathKey, items]) => {
      // Ensure the structural folders exist for this key (e.g., "Geometry/Primitives")
      const parentFolder = ensureFolder(pathKey);

      items.forEach((item) => {
        const itemNode: IAsset = {
          // Fallback to name if unique ID isn't provided in the source items
          id: item.id || `${pathKey}/${item.name}`,
          name: item.name,
          type: item.type.toLowerCase(),
          virtualPath: item.virtualPath,
          projectId: project.id,
        };

        parentFolder.children!.push(itemNode);
      });
    });

    // Deep sort folders first, then files alphabetically
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
