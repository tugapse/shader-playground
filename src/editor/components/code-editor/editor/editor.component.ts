import { Component, signal, effect, inject, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AssetService } from '../../../../app/api/services/asset.service';
import { EditorStateService } from '../../../services/editor-state.service';
import { IAsset } from '../../../interfaces/asset.interface';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'editor-code-editor',
  standalone: true,
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeEditorLogic {
  private assetApi = inject(AssetService);
  private editorState = inject(EditorStateService);

  activeAsset = this.editorState.selectedAsset;
  isDirty = this.editorState.isDirty;

  isLoading = signal(false);
  content = signal('');

  @ViewChild('editorHost') editorHost!: ElementRef;
  private editorInstance: any;

  constructor() {
    effect(() => {
      const asset = this.activeAsset();
      if (asset && asset.type !== 'folder') {
        this.loadScript(asset);
      } else {
        this.content.set('');
        this.updateEditorValue('');
      }
    });
  }

  async loadScript(asset: IAsset) {
    this.isLoading.set(true);
    this.assetApi.getTextAssetContent(asset.projectId, asset.id).subscribe({
      next: (textContent:string) => {
        this.content.set(textContent);
        this.updateEditorValue(textContent);
        this.editorState.setDirty(false);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveContent() {
    const asset = this.activeAsset();
    if (!asset || !this.editorState.isDirty()) return;

    this.assetApi.updateRawAssetContent(asset.projectId, asset.id, this.content()).subscribe(() => {
      this.editorState.setDirty(false);
      console.log('File saved successfully!');
    });
  }

  private updateEditorValue(val: string) {
    if (this.editorInstance) {
      this.editorInstance.setValue(val);
    }
  }

  onCodeChange(newCode: string) {
    this.content.set(newCode);
    this.editorState.setDirty(true);
  }
}
