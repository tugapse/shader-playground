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
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
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
    effect(() => {
      const project = this.editorState.activeProject();
      if (project?.id) {
        this.projectId = project.id;
        if (this.editorInstance) {
          this.loadWorkspaceTree();
          this.loadIntelliSenseDefinitions();
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

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      noEmit: true,
      strict: true,
      noImplicitAny: true,
      allowJs: true,
      checkJs: true,
    });

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

    this.editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        this.saveCurrentChanges();
      },
    );

    if (this.projectId) {
      this.loadWorkspaceTree();
      this.loadIntelliSenseDefinitions();
    }
  }

  public loadIntelliSenseDefinitions(): void {
    const monaco = (window as any).monaco;
    if (!monaco || !this.projectId) return;

    this.codeService.getEngineTypings(this.projectId).subscribe({
      next: (rawDeclarations) => {
        const wrappedEngineLib = `
          declare module 'omega-game-engine' {
            ${rawDeclarations}
          }
        `;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          wrappedEngineLib,
          'file:///node_modules/@types/omega-game-engine/index.d.ts',
        );
      },
      error: (err) =>
        console.error('Failed to update SDK library declarations:', err),
    });

    this.codeService.getWorkspaceTypings(this.projectId).subscribe({
      next: (userDeclarations) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          userDeclarations,
          'file:///node_modules/@types/omega-user-project/index.d.ts',
        );
      },
      error: (err) =>
        console.error(
          'Failed to update workspace behavior metadata profile:',
          err,
        ),
    });
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
      const rawLang = fileResult.language?.toLowerCase();
      const langMapping =
        rawLang === 'ts' || rawLang === 'typescript' || !rawLang
          ? 'typescript'
          : 'javascript';

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

    const fileName = prompt(
      'Enter name of the new file at workspace root (e.g., Player.ts):',
    );
    if (!fileName) return;

    this.codeService.createFile(this.projectId, fileName).subscribe({
      next: () => this.loadWorkspaceTree(),
    });
  }

  public triggerCreateFileInFolder(): void {
    if (!this.selectedContextMenuNode || !this.projectId) return;
    const fileName = prompt('Enter name of the new file (e.g., Component.ts):');
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

    // 🎯 Swapped out delta patches for direct, full atomic content overwrites
    this.codeService
      .updateFileContent(
        this.projectId,
        this.activeFileResult.path,
        currentText,
      )
      .subscribe({
        next: () => {
          console.log(
            `Changes flushed safely for: ${this.activeFileResult?.path}`,
          );
          this.executeWorkspaceCompilation();
        },
      });
  }

  private executeWorkspaceCompilation(): void {
    const monaco = (window as any).monaco;
    if (!this.editorInstance || !this.projectId) return;

    const currentModel = this.editorInstance.getModel();

    this.codeService.compileWorkspace(this.projectId).subscribe({
      next: (result) => {
        if (result.success) {
          console.log(
            '🚀 Compilation successful! Staging promoted onto stable production.',
          );
          monaco.editor.setModelMarkers(currentModel, 'compiler', []);
          this.loadIntelliSenseDefinitions();
        } else {
          console.warn(
            '⚠️ Compilation validation errors intercepted:',
            result.errors,
          );

          if (result.errors) {
            const errorMarkers = result.errors.map((err) => {
              const lineRegex = /\((\d+),(\d+)\):/;
              const match = lineRegex.exec(err.text);

              let startLineNumber = 1;
              let startColumn = 1;

              if (match) {
                startLineNumber = parseInt(match[1], 10);
                startColumn = parseInt(match[2], 10);
              }

              return {
                severity: monaco.MarkerSeverity.Error,
                message: err.text,
                startLineNumber,
                startColumn,
                endLineNumber: startLineNumber,
                endColumn: 100,
              };
            });

            monaco.editor.setModelMarkers(
              currentModel,
              'compiler',
              errorMarkers,
            );
          }
        }
      },
      error: (err) =>
        console.error('Microservice compile communications failure:', err),
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
