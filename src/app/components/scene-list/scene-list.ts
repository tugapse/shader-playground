import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AssetService } from "../../api/services/asset.service";
import {
  AssetResponse,
  ProjectResponse,
} from "../../api/models/omega-api.models";
import { Scene } from "omega-game-engine";
import { Router } from "@angular/router";
import { Icon } from "../icon/icon";
import { EngineAssetType } from "@editor/models/asset-types";

@Component({
  selector: "app-scene-list",
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: "./scene-list.html",
  styleUrl: "./scene-list.scss",
})
export class SceneList implements OnChanges {
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);

  @Input() project: ProjectResponse | null = null;

  scenes: AssetResponse[] = [];
  isModalOpen = false;
  newSceneName = "";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["project"] && this.project) {
      this.loadScenes();
    }
  }

  private loadScenes(): void {
    if (!this.project?.id) {
      this.scenes = [];
      return;
    }
    this.assetService
      .listAssets(this.project.id, EngineAssetType.Scene)
      .subscribe({
        next: (response) => {
          this.scenes =
            response.assets.filter(
              (e) => e.assetType === EngineAssetType.Scene,
            ) ?? [];
        },
        error: (err: any) => {
          console.error("Failed to load scenes", err);
          this.scenes = [];
        },
      });
  }

  navigateToEditor(scene: AssetResponse): void {
    if (this.project?.id) {
      this.router.navigate(["/editor", this.project.id, scene.id]);
    }
  }

  openNewSceneModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.newSceneName = "";
  }

  createScene(): void {
    if (!this.project?.id) {
      console.error("No project selected to create a scene in.");
      return;
    }
    if (!this.newSceneName.trim()) {
      return;
    }

    const sceneName = this.newSceneName.trim().endsWith(".scene")
      ? this.newSceneName.trim()
      : `${this.newSceneName.trim()}.scene`;

    const sceneObject = new Scene();
    sceneObject.name = sceneName;

    const virtualPath = `/Scenes/${sceneName}`;
    const sceneContent = JSON.stringify(sceneObject.toJsonObject());
    const sceneFile = new File([sceneContent], sceneName, {
      type: "application/json",
    });

    this.assetService
      .uploadAsset(
        this.project.id,
        sceneFile,
        virtualPath,
        EngineAssetType.Scene,
      )
      .subscribe({
        next: () => {
          console.log(`Scene '${sceneName}' created successfully.`);
          this.closeModal();
          this.loadScenes();
        },
        error: (err: any) => {
          console.error("Failed to create scene", err);
          // FIXME add info popup
        },
      });
  }
}
