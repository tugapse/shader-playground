import { Component, Input } from '@angular/core';
import { SceneTree } from "../scene-tree/scene-tree";
import { Scene } from '@engine/entities/scene';

@Component({
  selector: 'app-sidebar',
  imports: [SceneTree],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() scene!: Scene;

}
