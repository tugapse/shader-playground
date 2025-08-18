import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Scene } from '@engine/entities/scene';

@Component({
  selector: 'app-scene-tree',
  imports: [  CommonModule  ],
  templateUrl: './scene-tree.html',
  styleUrl: './scene-tree.scss'
})
export class SceneTree {

  @Input() public targetScene!: Scene;

}
