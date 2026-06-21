import { Component, Input, OnInit } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Scene } from '@engine';
import { Icon } from 'src/app/components/icon/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { GizmoMode } from '@editor/behaviours/scene-editor/gizmo-mode.enum';
import { TransformSpace } from '@editor/behaviours/scene-editor/transform-space.enum';
import { EditorStateService } from '@editor/services/editor-state.service';
import { AuthService } from '../../../app/api/services/auth.service';
import { UserService } from '../../../app/api/services/user.service';
import { UserResponse } from '../../../app/api/models/omega-api.models';
import { SceneTreeService } from '@editor/services/scene-tree.service';
import { ThemeSelector } from "../theme-selector/theme-selector";

@Component({
  selector: 'editor-top-bar',
  imports: [Icon, CommonModule, ThemeSelector],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss'
})
export class TopBar implements OnInit {


  @Input() scene!: Scene;
  @Input() isEditorPaused!: boolean;

  public gizmoMode: GizmoMode = GizmoMode.Translate;
  public GizmoMode = GizmoMode;

  public transformSpace: TransformSpace = TransformSpace.Local;
  public TransformSpace = TransformSpace;

  public user: UserResponse | undefined;

  constructor(
    private editorService: EditorService,
    public editorState: EditorStateService,
    private authService: AuthService,
    private userService: UserService,
    private sceneTreeService:SceneTreeService,
    private router: Router
  ) {
    this.editorService.gizmoMode.subscribe(mode => {
      this.gizmoMode = mode;
    });

    this.editorService.transformSpace.subscribe(space => {
      this.transformSpace = space;
    });
  }

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.userService.getMe().subscribe(user => {
        this.user = user;
      });
    }
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

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.user = undefined;
      this.router.navigate(['/login']);
    });
  }  
  
  inspectCamera(){
    this.sceneTreeService.onEntitySelected.emit(this.editorService.camera);
  }


  goHome() {
    this.router.navigate(['/home']);
  }
}