import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from 'src/app/components/icon/icon';
import {
  AssetCodeService,
  WorkspaceNode,
  FileContentResult,
} from '../asset-code.service';
import { EditorStateService } from '@editor/services/editor-state.service';

@Component({
  selector: 'app-omega-code-workspace',
  standalone: true,
  imports: [CommonModule, Icon],
  template: `
    <div class="workspace-root">
      <div class="leftSidebar">
        <div class="sidebar-header">Workspace Scripts</div>

        <div class="tree-toolbar">
          <button
            class="toolbar-btn"
            title="Create File"
            (click)="triggerCreateFileAtRoot()"
          >
            <app-icon iconName="fa-plus"></app-icon>
          </button>
          <button
            class="toolbar-btn"
            title="Refresh Tree"
            (click)="loadWorkspaceTree()"
          >
            <app-icon iconName="fa-sync"></app-icon>
          </button>
        </div>

        <div class="file-tree-container">
          <ng-container
            *ngTemplateOutlet="nodeTemplate; context: { $implicit: rootNode }"
          ></ng-container>
        </div>

        <button class="btn-compile-trigger" (click)="saveCurrentChanges()">
          💾 Save Changes
        </button>
      </div>

      <ng-template #nodeTemplate let-node>
        @if (node) {
          <ul class="file-node-list">
            @if (node.relativePath) {
              <li
                [class.active-file]="
                  activeFileResult?.path === node.relativePath
                "
                [style.padding-left.px]="calculatePadding(node.relativePath)"
                (click)="handleNodeClick(node)"
                (contextmenu)="openContextMenu($event, node)"
              >
                <span class="file-icon">{{
                  node.isDirectory ? '📁' : '📄'
                }}</span>
                <span class="node-name">{{ node.name }}</span>

                <button
                  class="inline-delete-btn"
                  title="Delete"
                  (click)="triggerDeleteNode($event, node)"
                >
                  <app-icon iconName="fa-trash"></app-icon>
                </button>
              </li>
            }
            @if (node.isDirectory && node.children) {
              @for (child of node.children; track child.relativePath) {
                <ng-container
                  *ngTemplateOutlet="
                    nodeTemplate;
                    context: { $implicit: child }
                  "
                ></ng-container>
              }
            }
          </ul>
        }
      </ng-template>

      @if (contextMenuVisible) {
        <div
          class="context-menu"
          [style.top.px]="contextMenuY"
          [style.left.px]="contextMenuX"
        >
          @if (selectedContextMenuNode?.isDirectory) {
            <div class="context-item" (click)="triggerCreateFileInFolder()">
              New File
            </div>
          }
          <div
            class="context-item delete"
            (click)="triggerDeleteNodeFromMenu()"
          >
            Delete
          </div>
        </div>
      }

      <div class="mainViewContent">
        <div class="canvas-wrapper">
          <div #monacoContainer class="monaco-mount-target"></div>
        </div>
      </div>

      <div class="rightSidebar">
        <div class="sidebar-header">Inspector</div>
        <div class="inspector-placeholder">
          <p>No entity selected</p>
        </div>
      </div>

      <div class="footer">
        <div class="terminal-status">
          <span class="status-indicator ready">●</span> Omega Editor Connected
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .workspace-root {
        display: grid;
        grid-template-columns: 240px 1fr 280px;
        grid-template-rows: 1fr 30px;
        width: 100vw;
        height: 100vh;
        background-color: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
        position: relative;
      }

      .sidebar-header {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #717171;
        font-weight: bold;
        padding-bottom: 8px;
        border-bottom: 1px solid #2d2d2d;
        margin-bottom: 0px;
      }

      .tree-toolbar {
        display: flex;
        gap: 4px;
        background-color: #2d2d2d;
        padding: 4px 8px;
        border-bottom: 1px solid #3c3c3c;
        margin-bottom: 8px;
      }

      .toolbar-btn {
        background: transparent;
        border: none;
        color: #cccccc;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .toolbar-btn:hover {
        background-color: #3c3c3c;
        color: #ffffff;
      }

      .leftSidebar {
        grid-column: 1;
        grid-row: 1;
        background-color: #252526;
        border-right: 1px solid #3c3c3c;
        padding: 12px 0 12px 0;
        display: flex;
        flex-direction: column;
      }

      .sidebar-header,
      .file-tree-container,
      .btn-compile-trigger {
        margin-left: 12px;
        margin-right: 12px;
      }

      .file-tree-container {
        flex: 1;
        overflow-y: auto;
      }

      .file-node-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .file-node-list li {
        padding: 6px 12px;
        font-size: 13px;
        cursor: pointer;
        color: #cccccc;
        border-radius: 4px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        user-select: none;
        position: relative;
      }
      .file-node-list li:hover {
        background-color: #2a2d2e;
        color: #fff;
      }
      .file-node-list li.active-file {
        background-color: #37373d;
        color: #fff;
        font-weight: 500;
      }
      .node-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .file-icon {
        margin-right: 6px;
      }

      .inline-delete-btn {
        background: transparent;
        border: none;
        color: #717171;
        cursor: pointer;
        display: none;
        padding: 2px 4px;
        border-radius: 3px;
      }
      .file-node-list li:hover .inline-delete-btn {
        display: block;
      }
      .inline-delete-btn:hover {
        color: #f85149;
        background-color: #3c3c3c;
      }

      .context-menu {
        position: absolute;
        z-index: 1000;
        background-color: #1c1c1c;
        border: 1px solid #454545;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        padding: 4px 0;
        min-width: 130px;
      }

      .context-item {
        padding: 6px 14px;
        font-size: 12px;
        cursor: pointer;
        color: #cccccc;
      }
      .context-item:hover {
        background-color: #007acc;
        color: white;
      }
      .context-item.delete:hover {
        background-color: #a61c1c;
      }

      .btn-compile-trigger {
        background-color: #0e639c;
        color: white;
        border: none;
        padding: 10px;
        font-size: 12px;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        margin-top: auto;
      }
      .btn-compile-trigger:hover {
        background-color: #1177bb;
      }

      .mainViewContent {
        grid-column: 2;
        background-color: #1e1e1e;
        position: relative;
      }
      .canvas-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .monaco-mount-target {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100% !important;
        height: 100% !important;
      }
      .rightSidebar {
        grid-column: 3;
        background-color: #252526;
        border-left: 1px solid #3c3c3c;
        padding: 12px;
      }
      .inspector-placeholder {
        font-size: 13px;
        color: #858585;
        text-align: center;
        margin-top: 40px;
      }
      .footer {
        grid-column: 1 / span 3;
        grid-row: 2;
        background-color: #007acc;
        color: white;
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 12px;
      }
      .terminal-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .status-indicator.ready {
        color: #89d185;
      }
    `,
  ],
})
export class OmegaCodeWorkspaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('monacoContainer') monacoContainer!: ElementRef;

  private codeService = inject(AssetCodeService);
  private editorState = inject(EditorStateService);
  private editorInstance: any;

  public projectId!: string;
  public rootNode: WorkspaceNode | null = null;
  public activeFileResult: FileContentResult | null = null;

  public contextMenuVisible = false;
  public contextMenuX = 0;
  public contextMenuY = 0;
  public selectedContextMenuNode: WorkspaceNode | null = null;

  @HostListener('contextmenu', ['$event'])
  onGlobalContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  @HostListener('document:click')
  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  constructor() {
    // Listens reactively to the core engine editor project selection state updates
    effect(() => {
      const project = this.editorState.activeProject();
      if (project?.id) {
        this.projectId = project.id;
        if (this.editorInstance) {
          this.loadWorkspaceTree();
        }
      } else {
        this.projectId = '';
        this.rootNode = null;
        this.activeFileResult = null;
        if (this.editorInstance) {
          this.editorInstance.setModel(null);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.loadMonacoDependencies();
  }

  private loadMonacoDependencies(): void {
    if ((window as any).monaco) {
      this.initMonacoInstance();
      return;
    }

    const loaderScript = document.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.src = '/assets/monaco/vs/loader.js';
    loaderScript.onload = () => {
      (window as any).require.config({ paths: { vs: '/assets/monaco/vs' } });
      (window as any).require(['vs/editor/editor.main'], () => {
        this.initMonacoInstance();
      });
    };
    document.body.appendChild(loaderScript);
  }

  private initMonacoInstance(): void {
    const monaco = (window as any).monaco;

    this.editorInstance = monaco.editor.create(
      this.monacoContainer.nativeElement,
      {
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "'Fira Code', Consolas, Monaco, monospace",
      },
    );

    if (this.projectId) {
      this.loadWorkspaceTree();
    }
  }

  public loadWorkspaceTree(): void {
    if (!this.projectId) return;

    this.codeService.getWorkspaceTree(this.projectId).subscribe({
      next: (tree) => {
        this.rootNode = tree;
        if (!this.activeFileResult) {
          const firstFile = this.findFirstFile(tree);
          if (firstFile) {
            this.handleNodeClick(firstFile);
          }
        }
      },
    });
  }

  public handleNodeClick(node: WorkspaceNode): void {
    if (node.isDirectory || !this.projectId) return;

    this.codeService
      .getFileContent(this.projectId, node.relativePath)
      .subscribe({
        next: (fileResult) => {
          this.mountFileInMonaco(fileResult);
        },
      });
  }

  private mountFileInMonaco(fileResult: FileContentResult): void {
    const monaco = (window as any).monaco;
    if (!monaco || !this.editorInstance) return;

    if (this.activeFileResult) {
      this.activeFileResult.content = this.editorInstance.getModel().getValue();
    }

    this.activeFileResult = fileResult;
    const fileUri = monaco.Uri.parse(`file:///${fileResult.path}`);

    let targetModel = monaco.editor.getModel(fileUri);
    if (!targetModel) {
      const langMapping =
        fileResult.language === 'ts' ? 'typescript' : 'javascript';
      targetModel = monaco.editor.createModel(
        fileResult.content,
        langMapping,
        fileUri,
      );
    } else {
      targetModel.setValue(fileResult.content);
    }

    this.editorInstance.setModel(targetModel);
  }

  public openContextMenu(event: MouseEvent, node: WorkspaceNode): void {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenuVisible = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.selectedContextMenuNode = node;
  }

  public triggerCreateFileAtRoot(): void {
    if (!this.projectId) return;

    const fileName = prompt('Enter name of the new file at workspace root:');
    if (!fileName) return;

    this.codeService.createFile(this.projectId, fileName).subscribe({
      next: () => this.loadWorkspaceTree(),
    });
  }

  public triggerCreateFileInFolder(): void {
    if (!this.selectedContextMenuNode || !this.projectId) return;
    const fileName = prompt('Enter name of the new file:');
    if (!fileName) return;

    const fullRelativePath = `${this.selectedContextMenuNode.relativePath}/${fileName}`;
    this.codeService.createFile(this.projectId, fullRelativePath).subscribe({
      next: () => this.loadWorkspaceTree(),
    });
  }

  public triggerDeleteNode(
    event: MouseEvent | null,
    node: WorkspaceNode,
  ): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.projectId) return;

    const confirmed = confirm(
      `Are you sure you want to permanently delete: ${node.name}?`,
    );
    if (!confirmed) return;

    this.codeService.deleteFile(this.projectId, node.relativePath).subscribe({
      next: () => {
        if (this.activeFileResult?.path === node.relativePath) {
          this.activeFileResult = null;
          this.editorInstance.setModel(null);
        }
        this.loadWorkspaceTree();
      },
    });
  }

  public triggerDeleteNodeFromMenu(): void {
    if (this.selectedContextMenuNode) {
      this.triggerDeleteNode(null, this.selectedContextMenuNode);
    }
  }

  public saveCurrentChanges(): void {
    if (!this.activeFileResult || !this.editorInstance || !this.projectId)
      return;

    const currentText = this.editorInstance.getModel().getValue();
    const deltaPayload = [
      {
        range: {
          startLine: 1,
          endLine: this.editorInstance.getModel().getLineCount(),
        },
        text: currentText,
      },
    ];

    this.codeService
      .updateFileDelta(this.projectId, this.activeFileResult.path, deltaPayload)
      .subscribe({
        next: () => {
          console.log(
            `Changes saved successfully for: ${this.activeFileResult?.path}`,
          );
        },
      });
  }

  public calculatePadding(path: string): number {
    return path.split('/').length * 12;
  }

  private findFirstFile(node: WorkspaceNode): WorkspaceNode | null {
    if (!node.isDirectory) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findFirstFile(child);
        if (found) return found;
      }
    }
    return null;
  }

  ngOnDestroy(): void {
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
  }
}
