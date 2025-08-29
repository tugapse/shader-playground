import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';
import { Scene } from '@engine/entities/scene';
import { JsonSerializedData } from '@engine/interfaces/json-serialized-data';
import { Subscription } from 'rxjs';
import { EditorRenderBehaviour } from 'src/app/extra/editor-render-behaviour';
import { Canvas } from './components/canvas/canvas';
import { SceneTreeService } from './components/scene-tree/scene-tree.service';
import { Sidebar } from './components/sidebar/sidebar';
import { TopBar } from './components/top-bar/top-bar';
import { EditorService } from './editor.service';
import { Inpector } from './inspectors/inpector/inpector';
import { SceneManager } from '@engine/entities';

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
  private editorRenderBehaviour!: EditorRenderBehaviour;

  private gl!: WebGL2RenderingContext;
  private subs$: Subscription[] = [];

  private sceneState?: JsonSerializedData | null = null;

  constructor(
    private editorService: EditorService,
    private sceneTreeService: SceneTreeService) {
    this.subscribeEvents();
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
    if(this.sceneState){
      const newScene = SceneManager.loadScene(this.gl,this.sceneState);
      debugger
      this.editorService.loadScene(newScene);
      this.sceneState = null;
    }
  }

  private onSceneLoaded(scene: Scene) {
    if (this.scene) {
      this.scene.destroy();
    }
    this.scene = scene;
    this.scene.setGlRenderingContext(this.gl);
    this.scene.inEditMode = true;
  }

  private onScenePlay(scene: Scene) {
    this.sceneState = SceneManager.creatSceneSnapshot(scene);
    console.debug(this.sceneState);
    this.scene.initialize();
    this.scene.isRunning = true;
    this.isPaused = false;
  }

  private onScenePause(scene: Scene) {
    if (scene.isRunning == false) return;
    scene.isRunning = false;
    this.isPaused = true;
  }

  private onSceneStop(scene: Scene) {
    if (scene.isRunning == false && this.isPaused == false) return;
    scene.isRunning = false;
    this.isPaused = false;
    scene.destroy();
    this.editorService.onCanvasRequestReset.emit();
  }

  private onSceneTreeEntitySelected(entity: GlEntity): void {
    this.inspectorSelectedEntity = entity;
  }

  private subscribeEvents(): void {
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
}
