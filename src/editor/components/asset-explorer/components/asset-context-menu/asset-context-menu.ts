import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { IAsset } from '@editor/interfaces/asset.interface';

@Component({
  selector: 'app-asset-context-menu',
  standalone: true,
  templateUrl: './asset-context-menu.html',
  styleUrls: ['./asset-context-menu.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetContextMenuComponent {
  config = input.required<{
    visible: boolean;
    x: number;
    y: number;
    targetNode: IAsset | null;
  }>();

  rename = output<string>();
  delete = output<IAsset>();

  onRename() {
    const node = this.config().targetNode;
    if (!node) return;
    const newName = prompt('Enter new name:', node.name);
    if (newName) this.rename.emit(newName);
  }

  onDelete() {
    const node = this.config().targetNode;
    if (node && confirm(`Are you sure you want to delete ${node.name}?`)) {
      this.delete.emit(node);
    }
  }
}
