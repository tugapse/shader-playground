import { Component, Input } from '@angular/core';
import { Scene } from 'omega-game-engine';
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
