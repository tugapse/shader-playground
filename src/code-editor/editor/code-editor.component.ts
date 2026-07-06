import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  HostListener,
  signal,
  NgZone,
  ChangeDetectorRef, // 🎯 Phase 1: Injected to bring external scripts back into Angular's change lifecycle
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from 'src/app/components/icon/icon';
import {
  AssetCodeService,
  WorkspaceNode,
  FileContentResult,
} from '../asset-code.service';
import { EditorStateService } from '@editor/services/editor-state.service';
import { Subscription } from 'rxjs'; // 🎯 Phase 2: Structural cleanup handle

export interface EditorTab {
  file: FileContentResult;
  isDirty: boolean;
  model: any;
  listener: any;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-omega-code-workspace',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeWorkspaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('monacoContainer') monacoContainer!: ElementRef;

  private codeService = inject(AssetCodeService);
  private editorState = inject(EditorStateService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone); // 🎯 Phase 1: Track native browser async tasks

  private editorInstance: any;
  private subscriptions = new Subscription(); // 🎯 Phase 2: Unified observable tracking anchor

  public projectId!: string;
  public userUuid = 'test-user-uuid';
  public rootNode: WorkspaceNode | null = null;

  public tabs: EditorTab[] = [];
  public activeTab: EditorTab | null = null;

  public isSaving = false;
  public isCompiling = false;
  public compileStatus: 'idle' | 'success' | 'error' = 'idle';
  public toasts = signal<ToastMessage[]>([]);
  private nextToastId = 0;

  public errorCount = 0;
  public warningCount = 0;

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

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  constructor() {
    effect(() => {
      const project = this.editorState.activeProject();
      if (project?.id) {
        this.projectId = project.id;
        if (this.editorInstance) {
          this.closeAllTabsWithoutCheck();
          this.loadWorkspaceTree();
          this.loadIntelliSenseDefinitions();
        }
      } else {
        this.projectId = '';
        this.rootNode = null;
        this.closeAllTabsWithoutCheck();
        if (this.editorInstance) {
          this.editorInstance.setModel(null);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.loadMonacoDependencies();
  }

  private showToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ): void {
    const id = this.nextToastId++;
    this.toasts.update((current) => [...current, { id, message, type }]);
    setTimeout(
      () => {
        this.toasts.update((current) => current.filter((t) => t.id !== id));
      },
      type === 'error' ? 6000 : 4000,
    );
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

      // 🎯 Phase 1 Fix: Bring external module execution path explicitly back to Angular territory
      this.ngZone.run(() => {
        (window as any).require(['vs/editor/editor.main'], () => {
          this.initMonacoInstance();
        });
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

    const computedStyle = window.getComputedStyle(
      this.monacoContainer.nativeElement,
    );
    const background =
      computedStyle.getPropertyValue('--global-background-color').trim() ||
      '#0f111a';
    const foreground =
      computedStyle.getPropertyValue('--editor-panel-color').trim() ||
      '#a6accd';
    const accent =
      computedStyle.getPropertyValue('--editor-panel-H-color').trim() ||
      '#82aaff';
    const selection =
      computedStyle
        .getPropertyValue('--editor-icon-button-hover-background')
        .trim() || '#292d39';

    monaco.editor.defineTheme('omega-dynamic-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: foreground.replace('#', '') },
        {
          token: 'keyword',
          foreground: accent.replace('#', ''),
          fontStyle: 'bold',
        },
        { token: 'identifier', foreground: foreground.replace('#', '') },
      ],
      colors: {
        'editor.background': background,
        'editor.foreground': foreground,
        'editor.lineHighlightBackground': '#22242d',
        'editorLineNumber.foreground': '#4e5579',
        'editorLineNumber.activeForeground': accent,
        'editor.selectionBackground': selection,
        'editor.inactiveSelectionBackground': selection,
        'scrollbarSlider.background': '#292d39',
        'scrollbarSlider.hoverBackground': '#717cb4',
        'scrollbarSlider.activeBackground': accent,
      },
    });

    this.editorInstance = monaco.editor.create(
      this.monacoContainer.nativeElement,
      {
        theme: 'omega-dynamic-theme',
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

    monaco.editor.onDidChangeMarkers(() => {
      const currentModel = this.editorInstance.getModel();
      if (!currentModel) return;

      const markers = monaco.editor.getModelMarkers({
        resource: currentModel.uri,
      });
      this.errorCount = markers.filter(
        (m: any) => m.severity === monaco.MarkerSeverity.Error,
      ).length;
      this.warningCount = markers.filter(
        (m: any) => m.severity === monaco.MarkerSeverity.Warning,
      ).length;
    });

    // 🎯 Senior Guard: If the constructor effect already processed the projectId on boot,
    // we must kickstart the workspace load now that the editor instance is fully painted!
    if (this.projectId) {
      this.loadWorkspaceTree();
      this.loadIntelliSenseDefinitions();
    }
  }

  public loadIntelliSenseDefinitions(): void {
    const monaco = (window as any).monaco;
    if (!monaco || !this.projectId) return;

    this.subscriptions.add(
      this.codeService.getEngineTypings(this.projectId).subscribe({
        next: (rawDeclarations) => {
          const wrappedEngineLib = `declare module 'omega-game-engine' {\n${rawDeclarations}\n}`;
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            wrappedEngineLib,
            'file:///node_modules/@types/omega-game-engine/index.d.ts',
          );
        },
        error: (err) =>
          console.error('Failed to update SDK library declarations:', err),
      }),
    );

    this.subscriptions.add(
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
      }),
    );
  }

  public loadWorkspaceTree(): void {
    if (!this.projectId) return;

    this.subscriptions.add(
      this.codeService.getWorkspaceTree(this.projectId).subscribe({
        next: (tree) => {
          this.rootNode = tree;

          // 🚀 Force Angular to instantly paint the tree nodes without needing a DOM click
          this.cdr.detectChanges();

          if (this.tabs.length === 0) {
            const firstFile = this.findFirstFile(tree);
            if (firstFile) {
              this.handleNodeClick(firstFile);
            }
          }
        },
      }),
    );
  }

  public handleNodeClick(node: WorkspaceNode): void {
    if (node.isDirectory || !this.projectId) return;

    const existingTab = this.tabs.find(
      (t) => t.file.path === node.relativePath,
    );
    if (existingTab) {
      this.selectTab(existingTab);
      // 🚀 Force layout focus switch updates immediately
      this.cdr.detectChanges();
      return;
    }

    this.subscriptions.add(
      this.codeService
        .getFileContent(this.projectId, node.relativePath)
        .subscribe({
          next: (fileResult) => {
            this.createNewTab(fileResult);
            // 🚀 Force the newly added tab header item onto the workspace layout array
            this.cdr.detectChanges();
          },
        }),
    );
  }

  private createNewTab(fileResult: FileContentResult): void {
    const monaco = (window as any).monaco;
    if (!monaco || !this.editorInstance) return;

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
    }

    const newTab: EditorTab = {
      file: fileResult,
      isDirty: false,
      model: targetModel,
      listener: null,
    };

    newTab.listener = targetModel.onDidChangeContent(() => {
      if (!newTab.isDirty) {
        newTab.isDirty = true;
      }
    });

    this.tabs.push(newTab);
    this.selectTab(newTab);
  }

  public selectTab(tab: EditorTab): void {
    this.activeTab = tab;
    this.editorInstance.setModel(tab.model);
  }

  public closeTab(event: MouseEvent, tabToClose: EditorTab): void {
    event.stopPropagation();

    if (tabToClose.isDirty) {
      const confirmClose = confirm(
        `"${tabToClose.file.path}" has unsaved work. Discard changes?`,
      );
      if (!confirmClose) return;
    }

    this.forceCloseTab(tabToClose);
  }

  private forceCloseTab(tabToClose: EditorTab): void {
    if (tabToClose.listener) {
      tabToClose.listener.dispose();
    }

    // 🎯 Phase 2 Fix: Clear document completely out of Monaco text buffer pools to prevent memory bloat
    if (tabToClose.model) {
      tabToClose.model.dispose();
    }

    const index = this.tabs.indexOf(tabToClose);
    this.tabs = this.tabs.filter((t) => t !== tabToClose);

    if (this.activeTab === tabToClose) {
      if (this.tabs.length > 0) {
        const nextTab = this.tabs[Math.min(index, this.tabs.length - 1)];
        this.selectTab(nextTab);
      } else {
        this.activeTab = null;
        this.editorInstance.setModel(null);
      }
    }
  }

  private closeAllTabsWithoutCheck(): void {
    this.tabs.forEach((t) => {
      t.listener?.dispose();
      t.model?.dispose(); // 🎯 Phase 2 Fix: Flush models on mass closures
    });
    this.tabs = [];
    this.activeTab = null;
  }

  public hasUnsavedChanges(): boolean {
    return this.tabs.some((t) => t.isDirty);
  }

  public triggerGoBack(): void {
    if (this.hasUnsavedChanges()) {
      const leave = confirm(
        'You have unsaved workspace files open. Are you sure you want to go back?',
      );
      if (!leave) return;
    }
    this.editorState.centralView.set('canvas');
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

    this.subscriptions.add(
      this.codeService.createFile(this.projectId, fileName).subscribe({
        next: () => this.loadWorkspaceTree(),
      }),
    );
  }

  public triggerCreateFileInFolder(): void {
    if (!this.selectedContextMenuNode || !this.projectId) return;
    const fileName = prompt('Enter name of the new file (e.g., Component.ts):');
    if (!fileName) return;

    const fullRelativePath = `${this.selectedContextMenuNode.relativePath}/${fileName}`;
    this.subscriptions.add(
      this.codeService.createFile(this.projectId, fullRelativePath).subscribe({
        next: () => this.loadWorkspaceTree(),
      }),
    );
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

    this.subscriptions.add(
      this.codeService.deleteFile(this.projectId, node.relativePath).subscribe({
        next: () => {
          const deadTab = this.tabs.find(
            (t) => t.file.path === node.relativePath,
          );
          if (deadTab) {
            this.forceCloseTab(deadTab);
          }
          this.loadWorkspaceTree();
        },
      }),
    );
  }

  public triggerDeleteNodeFromMenu(): void {
    if (this.selectedContextMenuNode) {
      this.triggerDeleteNode(null, this.selectedContextMenuNode);
    }
  }

  public saveCurrentChanges(): void {
    if (
      !this.activeTab ||
      !this.editorInstance ||
      !this.projectId ||
      this.isSaving
    )
      return;

    this.isSaving = true;
    this.compileStatus = 'idle';
    const targetTab = this.activeTab;
    const currentText = this.editorInstance.getModel().getValue();

    this.subscriptions.add(
      this.codeService
        .updateFileContent(this.projectId, targetTab.file.path, currentText)
        .subscribe({
          next: () => {
            targetTab.isDirty = false;
            targetTab.file.content = currentText;
            this.isSaving = false;
            this.executeWorkspaceCompilation();
          },
          error: (err) => {
            this.isSaving = false;
            this.showToast(
              `Disk Sync Failed: Unable to flush changes to ${targetTab.file.path}`,
              'error',
            );
            console.error(err);
          },
        }),
    );
  }

  private executeWorkspaceCompilation(): void {
    const monaco = (window as any).monaco;
    if (!this.editorInstance || !this.projectId) return;

    this.isCompiling = true;
    const currentModel = this.editorInstance.getModel();

    this.subscriptions.add(
      this.codeService.compileWorkspace(this.projectId).subscribe({
        next: (result) => {
          this.isCompiling = false;
          if (result.success) {
            this.compileStatus = 'success';
            this.showToast(
              '🚀 Production Build Compiled Successfully!',
              'success',
            );
            monaco.editor.setModelMarkers(currentModel, 'compiler', []);
            this.loadIntelliSenseDefinitions();
          } else {
            this.compileStatus = 'error';
            this.showToast(
              '⚠️ Compilation failed. Check red indicators on lines.',
              'error',
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
        error: (err) => {
          this.isCompiling = false;
          this.compileStatus = 'error';
          this.showToast(
            'CRITICAL: Headless compile service communication fault.',
            'error',
          );
          console.error(err);
        },
      }),
    );
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
    this.closeAllTabsWithoutCheck();
    this.subscriptions.unsubscribe(); // 🎯 Phase 2 Fix: Unsubscribe from all dangling backend data streams cleanly
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
  }
}
