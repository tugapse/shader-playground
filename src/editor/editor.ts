import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';
import { Scene } from '@engine/entities/scene';
import { Subscription } from 'rxjs';
import { Canvas } from './components/canvas/canvas';
import { SceneTreeService } from './components/scene-tree/scene-tree.service';
import { Sidebar } from './components/sidebar/sidebar';
import { TopBar } from "./components/top-bar/top-bar";
import { EditorService } from './editor.service';
import { Inpector } from './inspectors/inpector/inpector';
import { JsonSerializedData } from '@engine/interfaces/json-serialized-data';

@Component({
  selector: 'app-editor',
  imports: [Canvas, Sidebar, CommonModule, Inpector, TopBar],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnDestroy {

  scene!: Scene;
  selectedEntity!: GlEntity;
  inspectorSelectedEntity!: GlEntity;
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
    this.sceneState = scene.toJsonObject();
    this.scene.isRunning = true;
  }

  private onScenePause(scene: Scene) {
    scene.isRunning = false;
  }

  private onSceneStop(scene: Scene) {
    this.scene = scene;
    this.scene.destroy();
    this.scene.fromJson(this.sceneState!);
    this.scene.initialize();
    this.sceneState = null;
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
