import { Component, Input } from '@angular/core';
import { EditorScene as Scene  } from '@editor/overrides/scene';
import { SceneTree } from "../scene-tree/scene-tree";

@Component({
  selector: 'editor-sidebar',
  imports: [SceneTree],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  @Input() scene!: Scene;

}
