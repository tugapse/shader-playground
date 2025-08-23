import { Component, Input, OnDestroy } from '@angular/core';
import { Canvas } from './components/canvas/canvas';
import { Sidebar } from './components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { Inpector } from './inspectors/inpector/inpector';
import { Scene } from '@engine/entities/scene';
import { GlEntity } from '@engine/entities/entity';
import { EditorService } from './editor.service';
import { Subscription } from 'rxjs';
import { SceneTreeService } from './components/scene-tree/scene-tree.service';

@Component({
  selector: 'app-editor',
  imports: [Canvas, Sidebar, CommonModule, Inpector],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnDestroy {

  scene!: Scene;
  selectedEntity!: GlEntity;
  inspectorSelectedEntity!: GlEntity;
  private gl!: WebGL2RenderingContext;
  private subs$: Subscription[] = [];

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
    this.scene.isEditorMode = true;
  }

  private onSceneTreeEntitySelected(entity: GlEntity): void {
    this.inspectorSelectedEntity = entity;
  }

  private subscribeEvents(): void {
    this.subs$.push(this.editorService.onSceneLoaded.subscribe(this.onSceneLoaded.bind(this)));
    this.subs$.push(this.sceneTreeService.onEntitySelected.subscribe(this.onSceneTreeEntitySelected.bind(this)));
  }

}
