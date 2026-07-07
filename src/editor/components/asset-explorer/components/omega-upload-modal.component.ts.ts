import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OmegaDropzoneComponent } from './omega-dropzone.component';

export interface StagedAssetResult {
  file: File;
  customName: string;
  assetType: string;
}

interface LocalStagedItem {
  id: string;
  file: File;
  customName: string;
  assetType: string;
  sizeFormatted: string;
}

@Component({
  selector: 'omega-upload-modal',
  standalone: true,
  imports: [FormsModule, OmegaDropzoneComponent],
  template: `
    <div class="modal-backdrop" (click)="onCancel()">
      <div class="modal-window" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Import Assets</h3>
          <span class="target-path"
            >Target: {{ targetFolderColumn() || '/' }}</span
          >
        </div>

        <div class="modal-body">
          <omega-dropzone (filesDropped)="onFilesIngested($event)">
            <div class="custom-dropzone-view">
              <span>📥</span>
              <p>
                Drag your files here or
                <span class="highlight">browse local storage</span>
              </p>
            </div>
          </omega-dropzone>

          @if (queue().length > 0) {
            <div class="staging-queue-container">
              <label class="section-title"
                >Staged Files ({{ queue().length }})</label
              >
              <div class="scrollable-queue-list">
                @for (item of queue(); track item.id) {
                  <div class="queue-row-card">
                    <div class="type-badge">
                      @switch (item.assetType) {
                        @case ('image') {
                          🖼️
                        }
                        @case ('audio') {
                          🔊
                        }
                        @case ('code') {
                          ⚡
                        }
                        @case ('scene') {
                          🎬
                        }
                        @default {
                          📦
                        }
                      }
                    </div>

                    <div class="row-inputs">
                      <div class="input-cell">
                        <input
                          type="text"
                          [(ngModel)]="item.customName"
                          class="editor-field"
                          placeholder="Asset target filename"
                        />
                      </div>
                      <div class="input-cell select-cell">
                        <select
                          [(ngModel)]="item.assetType"
                          class="editor-field dropdown"
                        >
                          <option value="raw">Raw File</option>
                          <option value="image">Texture Image</option>
                          <option value="audio">Audio Track</option>
                          <option value="code">Script / Shader</option>
                          <option value="scene">Scene JSON</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="action-delete-btn"
                      (click)="removeRow(item.id)"
                      title="Remove item"
                    >
                      ❌
                    </button>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="empty-queue-fallback">
              <p>
                Staging area is currently empty. Drop files above to prepare
                ingestion metadata configurations.
              </p>
            </div>
          }
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="queue().length === 0"
            (click)="onConfirm()"
          >
            Import Batch ({{ queue().length }})
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: var(--editor-modal-backdrop-background);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(
        2px
      ); /* Adds subtle editor-depth behind the popout window */
    }

    .modal-window {
      background-color: var(--editor-panel-background);
      border: var(--editor-panel-border);
      border-radius: 6px;
      width: 680px; /* Slightly wider layout to ensure input text is readable */
      max-width: 90vw;
      box-shadow: var(--editor-modal-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
        sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Header Section */
    .modal-header {
      padding: 14px 20px;
      background-color: var(--editor-panel-background-50);
      border-bottom: var(--editor-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        // font-size: 1.1rem;
        color: var(--editor-panel-header-title-color);
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      .target-path {
        // font-size: 0.8rem;
        color: var(
          --editor-panel-H-color
        ); /* Changed from dark blue to high-contrast blue */
        font-family: monospace;
        background-color: var(--editor-panel-text-input-background);
        padding: 2px 8px;
        border-radius: 3px;
        border: 1px solid var(--editor-panel-text-input-border);
      }
    }

    /* Body Area */
    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Dropzone custom placeholder overrides */
    .custom-dropzone-view {
      padding: 10px 0;
      span {
        // font-size: 1.8rem;
      }
      p {
        margin: 8px 0 0;
        // font-size: 0.9rem;
        color: var(--editor-panel-color);

        .highlight {
          color: var(--editor-panel-H-color);
          font-weight: 600;
          text-decoration: underline;
        }
      }
    }

    /* Queue Container Layout */
    .staging-queue-container {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .section-title {
        // font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--editor-panel-section-header);
        font-weight: 700;
      }
    }

    .scrollable-queue-list {
      max-height: 260px;
      overflow-y: auto;
      border: var(--editor-panel-border);
      background-color: var(
        --editor-panel-text-input-background
      ); /* Darker list background for depth contrast */
      border-radius: 4px;
      padding: 6px;

      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      &::-webkit-scrollbar-track {
        background: var(--scrollbar-track-background);
      }
      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb-background);
        border-radius: 3px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover-background);
      }
    }

    /* Item Card Rows Configuration */
    .queue-row-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: var(--editor-panel-background-50);
      border: var(--editor-panel-border);
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 6px;
      transition: border-color 0.15s ease;

      &:last-child {
        margin-bottom: 0;
      }
      &:hover {
        border-color: rgba(130, 170, 255, 0.4);
      }
    }

    .type-badge {
      // font-size: 1.1rem;
      width: 28px;
      height: 28px;
      background-color: var(--editor-panel-background-10);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .row-inputs {
      display: flex;
      flex: 1;
      gap: 10px;

      .input-cell {
        flex: 2;
        &.select-cell {
          flex: 1;
          min-width: 140px;
        }
      }
    }

    /* Fields readability boosts */
    .editor-field {
      width: 100%;
      background-color: var(--editor-panel-text-input-background);
      color: var(--editor-panel-text-input-color);
      border: var(--editor-panel-text-input-border);
      border-radius: 3px;
      padding: 6px 10px;
      // font-size: 0.85rem;
      outline: none;
      box-sizing: border-box;
      transition: all 0.15s ease;

      &:focus {
        border-color: var(--editor-panel-H-color);
        box-shadow: var(--editor-focus-shadow);
      }

      &.dropdown {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23717cb4' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        padding-right: 24px;
      }
    }

    .action-delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      // font-size: 0.8rem;
      padding: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: rgba(240, 113, 120, 0.2);
      }
    }

    /* Fallback placeholder empty state readability fix */
    .empty-queue-fallback {
      padding: 32px 20px;
      text-align: center;
      border: 1px dashed var(--editor-panel-text-input-border);
      background-color: var(--editor-panel-background-50);
      border-radius: 4px;
      color: var(
        --editor-panel-color
      ); /* Changed from dark blue-gray to clear readable font color */
      // font-size: 0.85rem;
      line-height: 1.4;
      margin: 0;
    }

    /* Footer / Actions Bar */
    .modal-footer {
      padding: 14px 20px;
      background-color: var(--editor-panel-background-50);
      border-top: var(--editor-panel-border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn {
      padding: 6px 16px;
      // font-size: 0.85rem;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-0.5px);
      }
      &:active:not(:disabled) {
        transform: translateY(0.5px);
      }
      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      &.btn-secondary {
        background-color: var(--editor-panel-text-input-background);
        color: var(--editor-panel-color);
        border: var(--editor-panel-text-input-border);

        &:hover:not(:disabled) {
          border-color: var(--editor-panel-chevron-color);
          color: var(--editor-panel-header-title-color);
        }
      }

      &.btn-primary {
        background-color: var(--editor-panel-H-color);
        color: #0f111a; /* Hardcoded dark tone to ensure contrast on bright neon blue background button */
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }
  `,
})
export class OmegaUploadModalComponent {
  // Destination paths targeted inside the asset filesystem tree hierarchy
  targetFolderColumn = input<string>('');

  // Resolution outputs events returned straight back to operational caller bounds
  confirmed = output<StagedAssetResult[]>();
  closed = output<void>();

  // Staging array cache
  readonly queue = signal<LocalStagedItem[]>([]);

  onFilesIngested(files: File[]) {
    const updatedQueue = [...this.queue()];

    files.forEach((file) => {
      updatedQueue.push({
        id: crypto.randomUUID(),
        file,
        customName: file.name,
        assetType: this.inferAssetType(file.name),
        sizeFormatted: this.formatBytes(file.size),
      });
    });

    this.queue.set(updatedQueue);
  }

  removeRow(id: string) {
    this.queue.update((current) => current.filter((item) => item.id !== id));
  }

  onCancel() {
    this.closed.emit();
  }

  onConfirm() {
    const results: StagedAssetResult[] = this.queue().map((item) => ({
      file: item.file,
      customName: item.customName,
      assetType: item.assetType,
    }));
    this.confirmed.emit(results);
  }

  private inferAssetType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'tga', 'dds', 'hdr'].includes(ext))
      return 'image';
    if (['wav', 'mp3', 'ogg'].includes(ext)) return 'audio';
    if (['ts', 'glsl', 'wgsl'].includes(ext)) return 'code';
    if (['scene', 'mat', 'json'].includes(ext)) return 'scene';
    return 'raw';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
