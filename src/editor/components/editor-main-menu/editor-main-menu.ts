import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem, MenuItemComponent } from '../menu-item/menu-item';
import { WindowService } from '@editor/services/window.service';
import { SoundMixerComponent } from '../sound-mixer/sound-mixer';
import { AssetsExplorerComponent } from '../asset-explorer/assets-explorer.component';
import { EditorSettingsService } from '@editor/services/editor.settings';
import { OmegaCodeWorkspaceComponent } from '../code-editor/editor/code-editor.component';
import { EditorStateService } from '@editor/services/editor-state.service';

@Component({
  selector: 'editor-main-menu',
  imports: [MenuItemComponent],
  templateUrl: './editor-main-menu.html',
  styleUrl: './editor-main-menu.scss',
})
export class EditorMainMenu {
  @Input() items: MenuItem[] = [];
  @Output() menuItemClicked: EventEmitter<MenuItem> =
    new EventEmitter<MenuItem>();

  displayItems: MenuItem[] = [];

  constructor(
    private readonly windowService: WindowService,
    private editorSettings: EditorSettingsService,
    private editorStateService: EditorStateService,
  ) {
    this.createMenuItems();
  }

  createMenuItems() {
    this.displayItems.push({ id: 'edit', label: 'Edit' });
    this.displayItems.push({
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'windows',
          label: 'Windows',
          items: [
            { id: 'mixer', label: 'Sound Mixer' },
            { id: 'assetExplorer', label: 'Asset Explorer' },
            { id: 'codeEditor', label: 'Code Editor' },
          ],
        },
        {
          id: 'panels',
          label: 'Panels',
          items: [
            { id: 'leftSidebar', label: 'Left Sidebar' },
            { id: 'rightSidebar', label: 'Right Sidebar' },
            { id: 'footer', label: 'Footer' },
          ],
        },
      ],
    });
    this.displayItems.push(...this.items);
  }

  onMenuItemClick(menuItem: MenuItem) {
    switch (menuItem.id) {
      case 'leftSidebar':
        this.editorSettings.settings.workspace.showLeftpanel =
          !this.editorSettings.settings.workspace.showLeftpanel;

        break;
      case 'rightSidebar':
        this.editorSettings.settings.workspace.showRightpanel =
          !this.editorSettings.settings.workspace.showRightpanel;

        break;
      case 'footer':
        this.editorSettings.settings.workspace.showFooter =
          !this.editorSettings.settings.workspace.showFooter;

        break;
      case 'mixer':
        this.windowService.open({
          component: SoundMixerComponent,
          title: 'Sounds Mixer',
          iconName: 'fa-sound',
          footer: '',
        });
        break;
      case 'assetExplorer':
        this.windowService.open({
          component: AssetsExplorerComponent,
          title: 'Asset Explorer',
          iconName: 'fa-folder',
          footer: '',
        });
        break;
      case 'codeEditor':
        this.editorStateService.centralView.set('code');
        break;

      default:
        break;
    }
  }
}
