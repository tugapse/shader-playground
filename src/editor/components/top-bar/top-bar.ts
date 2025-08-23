import { Component, Input } from '@angular/core';
import { EditorService } from '@editor/editor.service';
import { Scene } from '@engine/entities/scene';
import { Icon } from 'src/app/components/icon/icon';

@Component({
  selector: 'editor-top-bar',
  imports: [Icon],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss'
})
export class TopBar {

  @Input() scene!: Scene;

  constructor(private editorService: EditorService) {

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
}
