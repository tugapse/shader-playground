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
  ChangeDetectorRef,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Icon } from "src/app/components/icon/icon";
import { AssetCodeService } from "../asset-code.service";
import {
  WorkspaceNode,
  FileContentResult,
  CreateFileRequest,
} from "../asset-code.models";
import { EditorStateService } from "@editor/services/editor-state.service";
import { Subscription } from "rxjs";
import { LoadingService } from "src/app/services/loading.service";
import { Router } from "@angular/router";
import { MonacoService } from "../monaco.service";
import { WorkspaceComponent } from "@editor/components/workspace/workspace";

export interface EditorTab {
  file: FileContentResult;
  isDirty: boolean;
  model: any;
  listener: any;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

@Component({
  selector: "app-omega-code-workspace",
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: "./code-editor.component.html",
  styleUrls: ["./code-editor.component.scss"],
})
export class CodeWorkspaceComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @ViewChild("monacoContainer") monacoContainer!: ElementRef;

  private codeService = inject(AssetCodeService);
  private monacoService = inject(MonacoService); // 🎯 Injected here
  private editorState = inject(EditorStateService);
  private cdr = inject(ChangeDetectorRef);
  private loadingService = inject(LoadingService);
  private router = inject(Router);

  private subscriptions = new Subscription();
  public projectId!: string;
  public userUuid = "test-user-uuid";
  public rootNode: WorkspaceNode | null = null;

  public tabs: EditorTab[] = [];
  public activeTab: EditorTab | null = null;

  public isSaving = false;
  public isCompiling = false;
  public compileStatus: "idle" | "success" | "error" = "idle";
  public toasts = signal<ToastMessage[]>([]);
  private nextToastId = 0;

  public errorCount = 0;
  public warningCount = 0;

  public contextMenuVisible = false;
  public contextMenuX = 0;
  public contextMenuY = 0;
  public selectedContextMenuNode: WorkspaceNode | null = null;

  @HostListener("contextmenu", ["$event"])
  onGlobalContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  @HostListener("document:click")
  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  @HostListener("window:beforeunload", ["$event"])
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
        if (this.monacoService.isEditorReady()) {
          this.closeAllTabsWithoutCheck();
          this.loadWorkspaceTree();
          this.loadIntelliSenseDefinitions();
        }
      } else {
        this.projectId = "";
        this.rootNode = null;
        this.closeAllTabsWithoutCheck();
        this.monacoService.setModel(null);
      }
    });
  }

  ngOnInit(): void {
    this.loadingService.show();
  }

  ngAfterViewInit(): void {
    this.monacoService.loadDependencies(() => {
      this.initMonacoInstance();
    });
  }

  private showToast(
    message: string,
    type: "success" | "error" | "info" = "info",
  ): void {
    const id = this.nextToastId++;
    this.toasts.update((current) => [...current, { id, message, type }]);
    setTimeout(
      () => {
        this.toasts.update((current) => current.filter((t) => t.id !== id));
      },
      type === "error" ? 6000 : 4000,
    );
  }

  private initMonacoInstance(): void {
    this.monacoService.createEditor(
      this.monacoContainer.nativeElement,
      () => {
        this.saveCurrentChanges();
      },
      (errors, warnings) => {
        this.errorCount = errors;
        this.warningCount = warnings;
        this.cdr.detectChanges();
      },
    );

    if (this.projectId) {
      this.loadWorkspaceTree();
      this.loadIntelliSenseDefinitions();
    }
  }

  public loadIntelliSenseDefinitions(): void {
    if (!this.projectId) return;

    this.subscriptions.add(
      this.codeService.getEngineTypings(this.projectId).subscribe({
        next: (rawDeclarations) => {
          const wrappedEngineLib = `declare module 'omega-game-engine' {\n${rawDeclarations}\n}`;
          this.monacoService.updateIntelliSenseDefinitions(
            "file:///node_modules/@types/omega-game-engine/index.d.ts",
            wrappedEngineLib,
          );
        },
        error: (err) =>
          console.error("Failed to update SDK library declarations:", err),
      }),
    );

    this.subscriptions.add(
      this.codeService.getWorkspaceTypings(this.projectId).subscribe({
        next: (userDeclarations) => {
          this.monacoService.updateIntelliSenseDefinitions(
            "file:///node_modules/@types/omega-user-project/index.d.ts",
            userDeclarations,
          );
        },
        error: (err) =>
          console.error(
            "Failed to update workspace behavior metadata profile:",
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
          this.cdr.detectChanges();

          if (this.tabs.length === 0) {
            const firstFile = this.findFirstFile(tree);
            if (firstFile) {
              this.handleNodeClick(firstFile);
            } else {
              // 🎯 Senior Bugfix: If the workspace is empty, hide loading backdrop immediately
              this.loadingService.hide();
            }
          }
        },
        error: (err) => {
          this.loadingService.hide();
          console.error(err);
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
      this.cdr.detectChanges();
      return;
    }

    this.subscriptions.add(
      this.codeService
        .getFileContent(this.projectId, node.relativePath)
        .subscribe({
          next: (fileResult) => {
            this.createNewTab(fileResult);
            this.cdr.detectChanges();
          },
          // 🎯 Senior Bugfix: Anchor closing functions to complete block on workspace initial load
          complete: () => {
            this.loadingService.hide();
          },
          error: (err) => {
            this.loadingService.hide();
            console.error(err);
          },
        }),
    );
  }

  private createNewTab(fileResult: FileContentResult): void {
    const targetModel = this.monacoService.createOrGetModel(
      fileResult.path,
      fileResult.content,
      fileResult.language,
    );

    const newTab: EditorTab = {
      file: fileResult,
      isDirty: false,
      model: targetModel,
      listener: null,
    };

    newTab.listener = targetModel.onDidChangeContent(() => {
      if (!newTab.isDirty) {
        newTab.isDirty = true;
        this.cdr.detectChanges();
      }
    });

    this.tabs.push(newTab);
    this.selectTab(newTab);
  }

  public selectTab(tab: EditorTab): void {
    this.activeTab = tab;
    this.monacoService.setModel(tab.model);
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
        this.monacoService.setModel(null);
      }
    }
  }

  private closeAllTabsWithoutCheck(): void {
    this.tabs.forEach((t) => {
      t.listener?.dispose();
      t.model?.dispose();
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
        "You have unsaved workspace files open. Are you sure you want to go back?",
      );
      if (!leave) return;
    }
    this.editorState.centralView.set("canvas");
    this.router.navigate(["/home", this.editorState.activeProject()?.id]);
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
      "Enter name of the new file at workspace root (e.g., Player.ts):",
    );
    if (!fileName) return;

    this.subscriptions.add(
      this.codeService
        .createFile(this.projectId, { path: fileName, template: "" })
        .subscribe({
          next: () => this.loadWorkspaceTree(),
        }),
    );
  }

  public triggerCreateFileInFolder(): void {
    if (!this.selectedContextMenuNode || !this.projectId) return;
    const fileName = prompt("Enter name of the new file (e.g., Component.ts):");
    if (!fileName) return;

    const fullRelativePath = `${this.selectedContextMenuNode.relativePath}/${fileName}`;
    this.subscriptions.add(
      this.codeService
        .createFile(this.projectId, { path: fullRelativePath, template: "" })
        .subscribe({
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
      !this.monacoService.isEditorReady() ||
      !this.projectId ||
      this.isSaving
    )
      return;

    this.isSaving = true;
    this.compileStatus = "idle";
    const targetTab = this.activeTab;
    const currentText = this.monacoService.getModelValue();

    this.subscriptions.add(
      this.codeService
        .updateFileContent(this.projectId, {
          path: targetTab.file.path,
          content: currentText,
        })
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
              "error",
            );
            console.error(err);
          },
        }),
    );
  }

  private executeWorkspaceCompilation(): void {
    if (!this.monacoService.isEditorReady() || !this.projectId) return;

    this.isCompiling = true;

    this.subscriptions.add(
      this.codeService.compileWorkspace(this.projectId).subscribe({
        next: (result) => {
          this.isCompiling = false;
          if (result.success) {
            this.compileStatus = "success";
            this.showToast(
              "🚀 Production Build Compiled Successfully!",
              "success",
            );
            this.monacoService.clearAllModelMarkers("compiler");
            this.loadIntelliSenseDefinitions();
          } else {
            this.compileStatus = "error";
            this.showToast(
              "⚠️ Compilation failed. Check red indicators on lines.",
              "error",
            );

            if (result.errors) {
              const errorMarkers = result.errors.map((err: any) => {
                const lineRegex = /\((\d+),(\d+)\):/;
                const match = lineRegex.exec(err.text);

                let startLineNumber = 1;
                let startColumn = 1;

                if (match) {
                  startLineNumber = parseInt(match[1], 10);
                  startColumn = parseInt(match[2], 10);
                }

                return {
                  severity: (window as any).monaco.MarkerSeverity.Error,
                  message: err.text,
                  startLineNumber,
                  startColumn,
                  endLineNumber: startLineNumber,
                  endColumn: 100,
                };
              });
              this.monacoService.setModelMarkers("compiler", errorMarkers);
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isCompiling = false;
          this.compileStatus = "error";
          this.showToast(
            "CRITICAL: Headless compile service communication fault.",
            "error",
          );
          console.error(err);
          this.cdr.detectChanges();
        },
      }),
    );
  }

  public calculatePadding(path: string): number {
    return path.split("/").length * 12;
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
    this.subscriptions.unsubscribe();
    this.monacoService.disposeEditor(); // 🎯 Clean up memory structures completely
  }
}
