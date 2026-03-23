import { Component, signal, effect, inject, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AssetApiService } from '../../../api/assets.service';
import { EditorStateService } from '../../../services/editor-state.service';
import { IAsset } from '../../../interfaces/asset.interface';

@Component({
  selector: 'editor-code-editor',
  standalone: true,
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeEditorLogic {
  private assetApi = inject(AssetApiService);
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
        this.loadScript(asset.id);
      } else {
        this.content.set('');
        this.updateEditorValue('');
      }
    });
  }

  async loadScript(id: string) {
    this.isLoading.set(true);
    this.assetApi.getScriptContent(id).subscribe({
      next: (res) => {
        this.content.set(res.content);
        this.updateEditorValue(res.content);
        this.editorState.setDirty(false);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveContent() {
    const asset = this.activeAsset();
    if (!asset || !this.editorState.isDirty()) return;

    this.assetApi.updateScriptContent(asset.id, this.content()).subscribe(() => {
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
