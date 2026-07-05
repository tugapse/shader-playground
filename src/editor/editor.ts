import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Colors,
  Engine,
  SceneEntity,
  JsonSerializedData,
  Scene,
  SceneManager,
} from '@engine';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssetService } from 'src/app/api/services/asset.service';
import { EntityPicker as EditorEntityPicker } from './behaviours/scene-editor/entitypick.behaviour';
import { GizmosBoxBehaviour } from './behaviours/scene-editor/gizmos-behaviour';
import { EditorGridBehaviour } from './behaviours/scene-editor/grid-behaviour';
import { AssetsExplorerComponent } from './components/asset-explorer/assets-explorer.component';
import { Canvas, EngineStats } from './components/canvas/canvas';
import { EngineStatsComponent } from './components/engine-stats/engine-stats';
import { SceneTree } from './components/scene-tree/scene-tree';
import { TopBar } from './components/top-bar/top-bar';
import { AssetExplorerWindow } from './components/window/window';
import { WorkspaceComponent } from './components/workspace/workspace';
import { EditorInpector } from './inspectors/inpector-window/inpector';
import { IEditorSettings } from './interfaces/editor-settings';
import { EditorStateService } from './services/editor-state.service';
import { EditorService } from './services/editor.service';
import { EditorSettingsService } from './services/editor.settings';
import { SceneTreeService } from './services/scene-tree.service';
import { WindowService } from './services/window.service';
import { EditorMainMenu } from './components/editor-main-menu/editor-main-menu';
import { OmegaCodeWorkspaceComponent } from './components/code-editor/editor/editor.component';

@Component({
  selector: 'app-editor',
  imports: [
    CommonModule,
    EditorInpector,
    TopBar,
    SceneTree,
    AssetExplorerWindow,
    EngineStatsComponent,
    AssetsExplorerComponent,
    WorkspaceComponent,
    EditorMainMenu,
    OmegaCodeWorkspaceComponent,
    Canvas,
  ],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements OnDestroy, AfterViewInit {
  scene!: Scene;
  inspectorSelectedEntity!: SceneEntity;
  isPaused = false;
  canvasVisible = true;
  fpsCounter: number = 0;
  toastMessage: string | null = null;
  isFullScreen: boolean = false;
  stats!: EngineStats;

  protected gl!: WebGL2RenderingContext;
  protected sceneState?: JsonSerializedData | null = null;
  protected editorGridBehaviour!: EditorGridBehaviour;
  protected gizmosBehaviour!: GizmosBoxBehaviour;
  protected editorPickerBehaviour!: EditorEntityPicker;

  private toastTimeout: any;
  private settings!: IEditorSettings;
  private destroy$ = new Subject<void>();

  isLeftVisible: boolean = true;
  isRightVisible: boolean = false;
  isFooterVisible: boolean = false;
  isEngineStatsVisible: boolean = false;

  constructor(
    protected editorService: EditorService,
    protected sceneTreeService: SceneTreeService,
    protected editorSettings: EditorSettingsService,
    protected editorState: EditorStateService,
    protected windowService: WindowService,
    protected assetService: AssetService,
    protected route: ActivatedRoute,
    protected router: Router,
    protected cdr: ChangeDetectorRef,
  ) {
    this.subscribeEvents();
    (window as any)['omegaEditor'] = this;
  }

  ngAfterViewInit(): void {
    const projectId = this.route.snapshot.paramMap.get('project');
    const sceneId = this.route.snapshot.paramMap.get('scene');

    if (projectId && sceneId) {
      this.editorState.setActiveProject({
        id: projectId,
        scene: sceneId,
        config: {},
      });

      if (!this.route.snapshot.queryParamMap.get('write-scene')) {
        this.assetService
          .getTextAssetContent(projectId, sceneId)
          .subscribe((textContent) => {
            const sceneData = JSON.parse(textContent) as JsonSerializedData;

            SceneManager.loadScene(this.gl, sceneData).then((scene) => {
              this.editorService.loadScene(scene);
              this.editorService.requestCanvasResize();
            });
          });
      }
    } else {
      this.router.navigate(['/invalid-project']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.editorService.gameEngine.destroy();
  }

  onGlContextCreated(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.editorService.gameEngine.initialize(gl.canvas as HTMLCanvasElement);
    this.editorService.onRenderingContextCreated.emit(this.gl);
    this.createEditorBehaviours();
  }

  protected onSceneLoaded(scene: Scene): void {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = scene;
    this.scene.clearColor = Colors.cornflowerBlue;
    this.scene.setGlRenderingContext(this.gl);
    this.scene.inEditMode = true;
    this.addEditorBehaviours();
    this.editorService.requestCanvasResize();
  }

  protected onScenePlay(scene: Scene): void {
    if (this.scene.isRunning || this.isPaused) {
      this.scene.isRunning = true;
      this.isPaused = false;
      return;
    }
    this.sceneState = SceneManager.creatSceneSnapshot(scene);
    this.scene.initialize();
    this.scene.isRunning = true;
    this.isPaused = false;
  }

  protected onScenePause(scene: Scene): void {
    if (scene.isRunning == false) return;
    scene.isRunning = false;
    this.isPaused = true;
  }

  protected async onSceneStop(scene: Scene): Promise<void> {
    if (scene.isRunning == false && this.isPaused == false) return;
    scene.isRunning = false;
    this.isPaused = false;
    scene.destroy();

    if (this.sceneState) {
      const newScene = await SceneManager.loadScene(this.gl, this.sceneState);
      this.editorService.loadScene(newScene);
      this.sceneState = null;
    }
  }

  protected onSceneTreeEntitySelected(entity: SceneEntity): void {
    this.inspectorSelectedEntity = entity;
    this.gizmosBehaviour.setTargetEntity(entity);
  }

  protected subscribeEvents(): void {
    this.sceneTreeService.onEntitySelected
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onSceneTreeEntitySelected.bind(this));

    this.editorService.onSceneLoaded
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onSceneLoaded.bind(this));

    this.editorService.onScenePlay
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onScenePlay.bind(this));

    this.editorService.onScenePause
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onScenePause.bind(this));

    this.editorService.onSceneStop
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onSceneStop.bind(this));

    this.editorSettings.onSettingsChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.updateEditorSettings.bind(this));

    this.editorService.onRenderFrame
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onRenderFrame.bind(this));

    this.editorService.onUpdateFrame
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onUpdateFrame.bind(this));

    this.editorService.onCanvasRequestResize
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.onCanvasResize.bind(this));
  }

  private onCanvasResize(size: { width: number; height: number }) {
    if (this.scene) {
      this.scene.renderPipeline.resize(size.width, size.height);
    }
  }

  private onRenderFrame(): void {
    this.gizmosBehaviour?.draw();
    this.editorPickerBehaviour?.draw();
    this.editorGridBehaviour?.draw();
  }

  private onUpdateFrame(ellapsed: number): void {
    this.gizmosBehaviour?.updateEditor(ellapsed);
    this.editorPickerBehaviour?.update(ellapsed);
    this.editorGridBehaviour?.update(ellapsed);
  }

  onEditorSaveInStorage(): void {
    const data = {
      scene: this.scene.toJsonObject(),
    };
    const jsonString = JSON.stringify(data);
    sessionStorage.setItem('omg_scene', jsonString);
  }

  loadFromStorage(): void {
    const sceneDataString = sessionStorage.getItem('omg_scene');
    if (sceneDataString) {
      this.sceneState = JSON.parse(sceneDataString);
      this.clearStorage();
    }
  }

  clearStorage(): void {
    sessionStorage.removeItem('omg_scene');
  }

  createEditorBehaviours(): void {
    this.editorGridBehaviour = new EditorGridBehaviour(this.gl);
    this.gizmosBehaviour = new GizmosBoxBehaviour(this.gl, this.editorService);
    this.editorPickerBehaviour = new EditorEntityPicker(
      this.gl,
      this.sceneTreeService,
    );
    this.editorPickerBehaviour.boundingBehaviour = this.gizmosBehaviour;

    if (this.settings) {
      this.updateEditorSettings(this.settings);
    }
  }

  addEditorBehaviours(): void {
    this.editorGridBehaviour.parent = this.scene;
    this.gizmosBehaviour.parent = this.scene;
    this.editorPickerBehaviour.parent = this.scene;
  }

  private updateEditorSettings(newSettings: IEditorSettings): void {
    if (!newSettings) return;

    this.settings = newSettings;
    if (this.editorGridBehaviour) {
      this.editorGridBehaviour.gridColor = this.settings.gridColor;
    }
    if (this.gizmosBehaviour) {
      this.gizmosBehaviour.selectedBoundingBoxColor =
        this.settings.selectedBoundingBoxColor;
      this.gizmosBehaviour.hoveredBoundingBoxColor =
        this.settings.hoveredBoundingBoxColor;
    }
  }

  onFpsUpdated(stats: EngineStats): void {
    this.stats = stats;
  }

  @HostListener('document:keydown.control.s', ['$event'])
  onKeydownHandler(event: Event): void {
    event.preventDefault();
    this.saveSceneToApi();
  }

  saveSceneToApi(): void {
    const project = this.editorState.activeProject();
    if (!project || !project.id || !project.scene) {
      console.error('No active project or scene to save.');
      return;
    }

    if (!this.scene) {
      console.error('Scene is not loaded, cannot save.');
      return;
    }

    this.toastMessage = 'Saving scene...';
    this.cdr.detectChanges();

    const sceneData = this.scene.toJsonObject();

    this.assetService
      .saveSceneAsset(project.id, project.scene, sceneData)
      .subscribe({
        next: (response) => {
          console.log('Scene saved successfully', response);
          this.showToast('Scene saved successfully!');
        },
        error: (err) => {
          console.error('Failed to save scene', err);
          this.showToast('Failed to save scene!');
        },
      });
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  toggleFullscreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.cdr.detectChanges();
    this.editorService.requestCanvasResize();
  }
}
