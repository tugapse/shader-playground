import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EditorRenderBehaviour } from 'src/app/extra/editor-render-behaviour';
import { Canvas } from './components/canvas/canvas';
import { SceneTreeService } from './services/scene-tree.service';
import { Sidebar } from './components/sidebar/sidebar';
import { TopBar } from './components/top-bar/top-bar';
import { Inpector } from './inspectors/inpector/inpector';
import { Scene, GlEntity, JsonSerializedData, SceneManager, Color, Colors } from 'omega-game-engine';
import { EditorService } from './services/editor.service';
import { EditorGridBehaviour } from './behaviours/editor.grid.behaviour';


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
  protected gridBehaviour!: EditorGridBehaviour;

  constructor(
    protected editorService: EditorService,
    protected sceneTreeService: SceneTreeService) {
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
    this.scene.addBehaviour(this.gridBehaviour);
    this.gridBehaviour.initialize();
  }

  protected onScenePlay(scene: Scene) {
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
  }

  protected subscribeEvents(): void {
    this.subs$.push(this.sceneTreeService.onEntitySelected.subscribe(this.onSceneTreeEntitySelected.bind(this)));
    this.subs$.push(this.editorService.onSceneLoaded.subscribe(this.onSceneLoaded.bind(this)));
    this.subs$.push(this.editorService.onScenePlay.subscribe(this.onScenePlay.bind(this)));
    this.subs$.push(this.editorService.onScenePause.subscribe(this.onScenePause.bind(this)));
    this.subs$.push(this.editorService.onSceneStop.subscribe(this.onSceneStop.bind(this)));
    this.subs$.push(this.editorService.onEditorSaveStateRequest.subscribe(this.onEditorSaveInStorage.bind(this)));
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
    this.gridBehaviour = new EditorGridBehaviour(this.gl);

  }
}
