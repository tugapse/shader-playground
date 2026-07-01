import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { IAsset } from '@editor/interfaces/asset.interface';

@Component({
  selector: 'app-asset-grid',
  standalone: true,
  templateUrl: './asset-grid.html',
  styleUrls: ['./asset-grid.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetGridComponent {
  activeFolder = input.required<IAsset | null>();
  selectedNodeId = input<string | null>(null);

  itemClick = output<IAsset>();
  itemDoubleClick = output<IAsset>();
  contextMenu = output<{ e: MouseEvent; node: IAsset }>();
}
