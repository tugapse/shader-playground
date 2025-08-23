import { Component, Input } from '@angular/core';
import { SceneTree } from "../scene-tree/scene-tree";
import { Scene } from '@engine/entities/scene';
import { GlEntity } from '@engine/entities/entity';

@Component({
  selector: 'editor-sidebar',
  imports: [SceneTree],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  @Input() scene!: Scene;

}
