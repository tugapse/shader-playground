import { Injectable, signal } from '@angular/core';
import { IProject } from '../interfaces/project.interface';
import { IAsset } from '../interfaces/asset.interface';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  public activeProject = signal<IProject | null>(null);
  public selectedAsset = signal<IAsset | null>(null);
  public openedFiles = signal<IAsset[]>([]);
  public isDirty = signal<boolean>(false);
  public centralView = signal<'canvas' | 'assets' | 'code-editor'>('canvas');

  public setCentralView(view: 'canvas' | 'assets' | 'code-editor'): void {
    this.centralView.set(view);
  }

  public setActiveProject(project: IProject | null): void {
    this.activeProject.set(project);
  }

  public setSelectedAsset(asset: IAsset | null): void {
    this.selectedAsset.set(asset);
    if (asset && asset.type !== 'folder') {
      if (!this.openedFiles().find(f => f.id === asset.id)) {
        this.addOpenedFile(asset);
      }
      this.setCentralView('code-editor');
    } else if (!asset) {
      this.setCentralView('canvas');
    }
  }

  public setOpenedFiles(files: IAsset[]): void {
    this.openedFiles.set(files);
  }

  public addOpenedFile(file: IAsset): void {
    if (file.type === 'folder') return;
    this.openedFiles.update(files => [...files, file]);
  }

  public removeOpenedFile(file: IAsset): void {
    this.openedFiles.update(files => files.filter(f => f.id !== file.id));
    if (this.selectedAsset()?.id === file.id) {
        this.selectedAsset.set(this.openedFiles()[0] || null);
    }
  }

  public setDirty(isDirty: boolean): void {
    this.isDirty.set(isDirty);
  }
}
