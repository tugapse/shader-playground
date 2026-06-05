import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../api/services/asset.service';
import { AssetResponse, ProjectResponse } from '../../api/models/omega-api.models';
import { Scene } from '@engine/entities/scene';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scene-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scene-list.html',
  styleUrl: './scene-list.scss'
})
export class SceneList implements OnChanges {
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);

  @Input() project: ProjectResponse | null = null;
  
  scenes: AssetResponse[] = [];
  isModalOpen = false;
  newSceneName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.loadScenes();
    }
  }

  private loadScenes(): void {
    if (!this.project?.id) {
      this.scenes = [];
      return;
    }
    this.assetService.listAssets(this.project.id, 'scene').subscribe({
      next: (response) => {
        this.scenes = response.assets ?? [];
      },
      error: (err: any) => {
        console.error('Failed to load scenes', err);
        this.scenes = [];
      }
    });
  }

  navigateToEditor(scene: AssetResponse): void {
    if (this.project?.id) {
      this.router.navigate(['/editor', this.project.id, scene.id]);
    }
  }

  openNewSceneModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.newSceneName = '';
  }

  createScene(): void {
    if (!this.project?.id) {
      console.error('No project selected to create a scene in.');
      return;
    }
    if (!this.newSceneName.trim()) {
      return; // Or show validation
    }

    const sceneName = this.newSceneName.trim().endsWith('.scene')
      ? this.newSceneName.trim()
      : `${this.newSceneName.trim()}.scene`;
      
    const sceneObject = new Scene();
    sceneObject.name = sceneName;

    
    const virtualPath = `/${sceneName}`;
    const sceneContent = JSON.stringify(sceneObject.toJSON());
    const sceneFile = new File([sceneContent], sceneName, { type: 'application/json' });

    this.assetService.uploadAsset(this.project.id, sceneFile, virtualPath, 'scene').subscribe({
      next: () => {
        console.log(`Scene '${sceneName}' created successfully.`);
        this.closeModal();
        this.loadScenes(); // Refresh the list
      },
      error: (err: any) => {
        console.error('Failed to create scene', err);
        // Optionally show an error in the modal
      }
    });
  }
}