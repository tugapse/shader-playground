import { Component, Input } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Scene } from '@engine';
import { Icon } from 'src/app/components/icon/icon';

import { GizmoMode } from '@editor/behaviours/scene-editor/gizmo-mode.enum';
import { TransformSpace } from '@editor/behaviours/scene-editor/transform-space.enum';
import { EditorStateService } from '@editor/services/editor-state.service';

@Component({
  selector: 'editor-top-bar',
  imports: [Icon],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss'
})
export class TopBar {


  @Input() scene!: Scene;
  @Input() isEditorPaused!: boolean;

  public gizmoMode: GizmoMode = GizmoMode.Translate;
  public GizmoMode = GizmoMode;

  public transformSpace: TransformSpace = TransformSpace.World;
  public TransformSpace = TransformSpace;

  constructor(
    private editorService: EditorService,
    public editorState: EditorStateService
    ) {
    this.editorService.gizmoMode.subscribe(mode => {
      this.gizmoMode = mode;
    });

    this.editorService.transformSpace.subscribe(space => {
      this.transformSpace = space;
    });
  }

  showAssets() {
    this.editorState.setCentralView('assets');
  }

  isAssetsActive() {
    return this.editorState.centralView() === 'assets';
  }

  onPlay() {
    this.editorService.requestScenePlay(this.scene);
  }

  onPause() {
    this.editorService.requestScenePause(this.scene);

  }

  onStop() {
    this.editorService.requestSceneStop(this.scene);

  }

  setGizmoMode(mode: GizmoMode) {
    this.editorService.setGizmoMode(mode);
  }

  toggleTransformSpace() {
    const newSpace = this.transformSpace === TransformSpace.World ? TransformSpace.Local : TransformSpace.World;
    this.editorService.setTransformSpace(newSpace);
  }

  onCodeEditor() {
    this.editorState.setCentralView('code-editor');
  }

}
