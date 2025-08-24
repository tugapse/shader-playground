import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';
import { Scene } from '@engine/entities/scene';
import { SceneManager } from '@engine/entities/scene-manager';
import { JsonSerializedData } from '@engine/interfaces/json-serialized-data';
import { Subscription } from 'rxjs';
import { Canvas } from './components/canvas/canvas';
import { SceneTreeService } from './components/scene-tree/scene-tree.service';
import { Sidebar } from './components/sidebar/sidebar';
import { EditorService } from './editor.service';
import { Inpector } from './inspectors/inpector/inpector';
import { TopBar } from './components/top-bar/top-bar';

@Component({
  selector: 'app-editor',
  imports: [Canvas, Sidebar, CommonModule, Inpector,TopBar],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnDestroy {

  scene!: Scene;
  selectedEntity!: GlEntity;
  inspectorSelectedEntity!: GlEntity;
  isPaused = false;

  private gl!: WebGL2RenderingContext;
  private subs$: Subscription[] = [];

  private sceneState?: JsonSerializedData | null = null;

  constructor(
    private editorService: EditorService,
    private sceneTreeService: SceneTreeService) {
    this.subscribeEvents();
  }

  ngOnDestroy(): void {
    this.subs$.forEach(sub => sub?.unsubscribe());
  }

  onGlContextCreated(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.editorService.onRenderingContextCreated.emit(this.gl);
  }

  private onSceneLoaded(scene: Scene) {
    this.scene = scene;
  }

  private onScenePlay(scene: Scene) {
    if (!this.sceneState) this.sceneState = JSON.parse(JSON.stringify(scene.toJsonObject()));
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
    this.isPaused = false;
    scene.isRunning = false;
    scene.destroy();
    const newScene = SceneManager.loadScene(this.gl, this.sceneState!);
    this.sceneState = null;
    this.editorService.loadScene(newScene);
    newScene.initialize();


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
  }

}
