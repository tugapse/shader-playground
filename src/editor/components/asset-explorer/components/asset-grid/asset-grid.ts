import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { IAsset } from '@editor/interfaces/asset.interface';
import { AssetIcons } from '../../icons';
import { Icon } from 'src/app/components/icon/icon';

@Component({
  selector: 'app-asset-grid',
  standalone: true,
  templateUrl: './asset-grid.html',
  styleUrls: ['./asset-grid.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
})
export class AssetGridComponent {
  activeFolder = input.required<IAsset | null>();
  selectedNodeId = input<string | null>(null);

  itemClick = output<IAsset>();
  itemDoubleClick = output<IAsset>();
  contextMenu = output<{ e: MouseEvent; node: IAsset }>();
  icons = AssetIcons;
}
