import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { IAsset } from '@editor/interfaces/asset.interface';
import { Icon } from 'src/app/components/icon/icon';
import { AssetIcons } from '../../icons';

@Component({
  selector: 'app-asset-tree',
  standalone: true,
  templateUrl: './asset-tree.html',
  styleUrls: ['./asset-tree.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Icon],
})
export class AssetTreeComponent {
  treeData = input.required<IAsset | null>();
  expandedNodes = input.required<Set<string>>();
  selectedNodeId = input<string | null>(null);

  nodeClick = output<IAsset>();
  contextMenu = output<{ e: MouseEvent; node: IAsset }>();
  icons = AssetIcons;

  isExpanded(node: IAsset): boolean {
    return this.expandedNodes().has(node.id || node.name);
  }
}
