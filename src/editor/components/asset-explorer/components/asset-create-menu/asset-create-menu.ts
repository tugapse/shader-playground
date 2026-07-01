import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

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
export class AssetCreateMenuComponent {
  create = output<string>();

  menuData: IMenuAction[] = [
    { label: 'Folder', icon: '📁', action: 'folder' },
    { label: 'Scene', icon: '🎬', action: 'scene' },
    { label: 'Script (.py)', icon: '📜', action: 'code' },
    {
      label: 'Material',
      icon: '🎨',
      children: [
        { label: 'Color Material', action: 'material/color' },
        { label: 'Unlit Material', action: 'material/unlit' },
        { label: 'Standard Material', action: 'material/standard' },
      ],
    },
    {
      label: 'Texture',
      icon: '🖼️',
      children: [
        { label: 'Texture 2D', action: 'texture/2d' },
        { label: 'Shadow Map', action: 'texture/shadowmap' },
      ],
    },
    {
      label: 'Entity',
      icon: '📦',
      children: [
        { label: 'Empty Entity', action: 'entity/empty' },
        { label: 'Skybox', action: 'entity/skybox' },
      ],
    },
  ];

  handleAction(event: MouseEvent, action?: string) {
    event.stopPropagation();
    if (action) {
      this.create.emit(action);
    }
  }
}
