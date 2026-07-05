import { Component, Input } from '@angular/core';
import { SceneTree } from '../scene-tree/scene-tree';
import { Scene } from 'omega-game-engine';

@Component({
  selector: 'editor-sidebar',
  imports: [SceneTree],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() scene!: Scene;
}
