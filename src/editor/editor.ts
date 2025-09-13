import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EditorRenderBehaviour } from 'src/app/extra/editor-render-behaviour';
import { Canvas } from './components/canvas/canvas';
import { SceneTreeService } from './services/scene-tree.service';
import { Sidebar } from './components/sidebar/sidebar';
import { TopBar } from './components/top-bar/top-bar';
import { Inpector } from './inspectors/inpector/inpector';
import { Scene, GlEntity, JsonSerializedData, SceneManager, Color, Colors, Shader, Vector3 } from 'omega-game-engine';
import { EditorService } from './services/editor.service';
import { EntityPicker as EditorEntityPicker } from './behaviours/scene-editor/entitypick.behaviour';
import { EditorSettingsService } from './services/editor.settings';
import { IEditorSettings } from './interfaces/editor-settings';
import { EditorGridBehaviour } from './behaviours/scene-editor/grid-behaviour';
import { EditorBoundingBoxBehaviour } from './behaviours/scene-editor/bounding-box-behaviour';


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
  protected editorRenderBehaviour!: EditorRenderBehaviour;

  protected gl!: WebGL2RenderingContext;
  protected subs$: Subscription[] = [];

  protected sceneState?: JsonSerializedData | null = null;
  protected editorGridBehaviour!: EditorGridBehaviour;
  protected editorBoundingBoxBehaviour!: EditorBoundingBoxBehaviour;
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
  //   this.editorGridBehaviour?.update(ellapsed);
  //   this.editorBoundingBoxBehaviour?.update(ellapsed);
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
    this.editorBoundingBoxBehaviour = new EditorBoundingBoxBehaviour(this.gl);
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
}
