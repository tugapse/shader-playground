import {
  Component,
  output,
  signal,
  HostListener,
  viewChild,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'omega-dropzone',
  standalone: true,
  imports: [],
  template: `
    <div class="dropzone-container" (click)="triggerFilePicker()">
      <input
        #fileInput
        type="file"
        multiple
        style="display: none;"
        (change)="onFileSelected($event)"
      />

      <div class="dropzone-content-wrapper">
        <ng-content>
          <div class="default-placeholder">
            <span class="upload-icon">📥</span>
            <p class="primary-text">
              Drag files here or <span class="highlight">browse</span>
            </p>
            <p class="secondary-text">Supports code, images, audio, meshes</p>
          </div>
        </ng-content>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }

    .dropzone-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 140px;
      background-color: var(--editor-panel-background-50);
      border: 1px dashed var(--editor-panel-text-input-border);
      border-radius: 4px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      box-sizing: border-box;

      &:hover {
        border-color: var(--editor-panel-H-color);
        background-color: var(--editor-panel-background-10);
      }
    }

    /* Activated state triggered on drag hover over layout */
    :host.is-dragging .dropzone-container {
      border-color: var(--editor-panel-H-color);
      background-color: var(--editor-panel-text-input-background);
      box-shadow:
        var(--editor-focus-shadow),
        inset 0 0 8px rgba(130, 170, 255, 0.1);
      transform: scale(0.995);
    }

    .dropzone-content-wrapper {
      text-align: center;
      pointer-events: none; /* Prevents nested element mouse drag event calculation jitter */
      width: 100%;
    }

    .default-placeholder {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .upload-icon {
        // font-size: 1.75rem;
        color: var(--editor-icon-button-color);
        opacity: 0.8;
      }

      .primary-text {
        // font-size: 0.85rem;
        color: var(--editor-panel-color);
        margin: 0;

        .highlight {
          color: var(--editor-panel-H-color);
          font-weight: 500;
        }
      }

      .secondary-text {
        // font-size: 0.75rem;
        color: var(--editor-placeholder-icon-color);
        margin: 0;
      }
    }
  `,
  host: {
    '[class.is-dragging]': 'isDragging()',
    class: 'omega-dropzone-block',
  },
})
export class OmegaDropzoneComponent {
  // Modern Output API
  filesDropped = output<File[]>();

  // Reactive state to handle visual layout changes
  readonly isDragging = signal<boolean>(false);

  // Hidden native element pointer hook
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.emitFileList(files);
    }
  }

  triggerFilePicker() {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.emitFileList(input.files);
      input.value = ''; // Reset pointer pool stream
    }
  }

  private emitFileList(fileList: FileList) {
    const filesArray = Array.from(fileList);
    this.filesDropped.emit(filesArray);
  }
}
