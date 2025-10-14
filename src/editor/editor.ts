import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Colors, GlEntity, JsonSerializedData, Scene, SceneManager } from '@engine';
import { Subscription } from 'rxjs';
import { GizmosBoxBehaviour } from './behaviours/scene-editor/gizmos-behaviour';
import { EntityPicker as EditorEntityPicker } from './behaviours/scene-editor/entitypick.behaviour';
import { EditorGridBehaviour } from './behaviours/scene-editor/grid-behaviour';
import { Canvas } from './components/canvas/canvas';
import { Sidebar } from './components/sidebar/sidebar';
import { TopBar } from './components/top-bar/top-bar';
import { Inpector } from './inspectors/inpector/inpector';
import { IEditorSettings } from './interfaces/editor-settings';
import { EditorService } from './services/editor.service';
import { EditorSettingsService } from './services/editor.settings';
import { SceneTreeService } from './services/scene-tree.service';

@Component({
  selector: 'app-editor',
  imports: [Canvas, Sidebar, CommonModule, Inpector, TopBar],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnDestroy, OnInit {

  scene!: Scene;
  inspectorSelectedEntity!: GlEntity;
  isPaused = false;
  canvasVisible = true;
  fpsCounter: number = 0;


  protected gl!: WebGL2RenderingContext;
  protected subs$: Subscription[] = [];

  protected sceneState?: JsonSerializedData | null = null;
  protected editorGridBehaviour!: EditorGridBehaviour;
  protected editorBoundingBoxBehaviour!: GizmosBoxBehaviour;
  protected editorPickerBehaviour!: EditorEntityPicker;

  private settings!: IEditorSettings;
  constructor(
    protected editorService: EditorService,
    protected sceneTreeService: SceneTreeService,
    protected editorSettings: EditorSettingsService) {
    this.subscribeEvents();
    (window as any)['omegaEditor'] = this;
  }

  ngOnInit(): void {
    this.loadFromStorage();

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        if (this.scene.isRunning) {
          this.onScenePause(this.scene);
        } else {
          this.onScenePlay(this.scene);
        }
      }
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        this.onSceneStop(this.scene);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs$.forEach(sub => sub?.unsubscribe());
  }

  onGlContextCreated(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.editorService.onRenderingContextCreated.emit(this.gl);
    this.createEditorBehaviours();
  }

  protected onSceneLoaded(scene: Scene) {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = scene;
    this.scene.clearColor = Colors.cornflowerBlue;
    this.scene.setGlRenderingContext(this.gl);
    this.scene.inEditMode = true;
    this.addEditorBehaviours();
  }



  protected onScenePlay(scene: Scene) {
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

  protected onScenePause(scene: Scene) {
    if (scene.isRunning == false) return;
    scene.isRunning = false;
    this.isPaused = true;
  }

  protected onSceneStop(scene: Scene) {
    if (scene.isRunning == false && this.isPaused == false) return;
    scene.isRunning = false;
    this.isPaused = false;
    scene.destroy();
    const newScene = SceneManager.loadScene(this.gl, this.sceneState!);

    this.editorService.loadScene(newScene);
    this.sceneState = null;
    // this.editorService.onCanvasRequestReset.emit();
  }

  protected onSceneTreeEntitySelected(entity: GlEntity): void {
    this.inspectorSelectedEntity = entity;
    this.editorBoundingBoxBehaviour.setTargetEntity(entity);
  }

  protected subscribeEvents(): void {
    this.subs$.push(this.sceneTreeService.onEntitySelected.subscribe(this.onSceneTreeEntitySelected.bind(this)));
    this.subs$.push(this.editorService.onSceneLoaded.subscribe(this.onSceneLoaded.bind(this)));
    this.subs$.push(this.editorService.onScenePlay.subscribe(this.onScenePlay.bind(this)));
    this.subs$.push(this.editorService.onScenePause.subscribe(this.onScenePause.bind(this)));
    this.subs$.push(this.editorService.onSceneStop.subscribe(this.onSceneStop.bind(this)));
    this.subs$.push(this.editorService.onEditorSaveStateRequest.subscribe(this.onEditorSaveInStorage.bind(this)));
    this.subs$.push(this.editorSettings.onSettingsChanged.subscribe(this.updateEditorSettings.bind(this)));
    this.subs$.push(this.editorService.onRenderFrame.subscribe(this.onRenderFrame.bind(this)));
    this.subs$.push(this.editorService.onUpdateFrame.subscribe(this.onUpdateFrame.bind(this)));

  }

  private onRenderFrame() {
    this.editorGridBehaviour?.draw();
    this.editorBoundingBoxBehaviour?.draw();
    this.editorPickerBehaviour?.draw();
  }

  private onUpdateFrame(ellapsed: number) {
    this.editorBoundingBoxBehaviour.updateEditor(ellapsed);
    this.editorPickerBehaviour.update(ellapsed);
    this.editorGridBehaviour.update(ellapsed);
  }

  onEditorSaveInStorage(): void {
    const data = {
      scene: this.scene.toJsonObject(),
    }
    const jsonString = JSON.stringify(data);
    sessionStorage.setItem("omg_scene", jsonString);
  }

  loadFromStorage(): void {
    const sceneDataString = sessionStorage.getItem("omg_scene");
    if (sceneDataString) {
      this.sceneState = JSON.parse(sceneDataString);
      this.clearStorage();
    }
  }

  clearStorage(): void {
    sessionStorage.removeItem("omg_scene");
  }

  createEditorBehaviours() {
    this.editorGridBehaviour = new EditorGridBehaviour(this.gl);
    this.editorBoundingBoxBehaviour = new GizmosBoxBehaviour(this.gl, this.editorService);
    this.editorPickerBehaviour = new EditorEntityPicker(this.gl, this.sceneTreeService);
    this.editorPickerBehaviour.boundingBehaviour = this.editorBoundingBoxBehaviour;

    this.updateEditorSettings(this.settings);
  }

  addEditorBehaviours() {
    this.editorGridBehaviour.parent = this.scene;
    this.editorBoundingBoxBehaviour.parent = this.scene;
    this.editorPickerBehaviour.parent = this.scene;
  }

  private updateEditorSettings(newSettings: IEditorSettings) {
    this.settings = newSettings;
    if (this.editorGridBehaviour)
      this.editorGridBehaviour.gridColor = this.settings.sceneEditor.gridColor;
    if (this.editorBoundingBoxBehaviour) {

      this.editorBoundingBoxBehaviour.selectedBoundingBoxColor = this.settings.sceneEditor.selectedBoundingBoxColor;
      this.editorBoundingBoxBehaviour.hoveredBoundingBoxColor = this.settings.sceneEditor.hoveredBoundingBoxColor;
    }
  }

  onFpsUpdated(fps: number) {
    this.fpsCounter = fps;
  }
}
