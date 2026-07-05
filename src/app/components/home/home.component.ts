import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackgroundVisualizationComponent } from '../background-visualization/background-visualization.component';
import { UserBarComponent } from '../user-bar/user-bar.component';
import { ProjectDetails } from '../project-details/project-details';
import { SceneList } from '../scene-list/scene-list';
import { ProjectService } from '../../api/services/project.service';
import {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../../api/models/omega-api.models';
import { AssetsExplorerComponent } from '@editor/components/asset-explorer/assets-explorer.component';
import { EditorService } from '@editor/services/editor.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BackgroundVisualizationComponent,
    UserBarComponent,
    ProjectDetails,
    SceneList,
    AssetsExplorerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  private readonly projectService = inject(ProjectService);

  selectedProject: ProjectResponse | null = null;
  projects: ProjectResponse[] = [];

  isModalOpen = false;
  newProjectName = '';

  constructor(private editorService: EditorService) {}

  ngAfterViewInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.projectService.listProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (err) => console.error('Failed to load projects', err),
    });
  }

  selectProject(project: ProjectResponse): void {
    this.editorService.gameEngine;
    this.selectedProject = project;
  }

  openNewProjectModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.newProjectName = '';
  }

  createProject(): void {
    if (!this.newProjectName.trim()) {
      return; // Or show a validation message
    }

    const payload: CreateProjectRequest = {
      name: this.newProjectName.trim(),
    };

    this.projectService.createProject(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadProjects(); // Refresh the list
      },
      error: (err) => {
        console.error('Failed to create project', err);
        // Optionally, show an error message in the UI
      },
    });
  }

  handleProjectUpdate(updatedProjectData: ProjectResponse): void {
    if (!updatedProjectData || !updatedProjectData.id) {
      console.error('Invalid project data received for update.');
      return;
    }

    const payload: UpdateProjectRequest = {
      name: updatedProjectData.name,
      description: updatedProjectData.description ?? undefined,
    };

    this.projectService
      .updateProject(updatedProjectData.id, payload)
      .subscribe({
        next: (savedProject) => {
          // Update the project in the main list
          const index = this.projects.findIndex(
            (p) => p.id === savedProject.id,
          );
          if (index !== -1) {
            this.projects[index] = savedProject;
          }

          // If the updated project is the currently selected one, update it
          if (
            this.selectedProject &&
            this.selectedProject.id === savedProject.id
          ) {
            this.selectedProject = { ...this.selectedProject, ...savedProject };
          }

          console.log('Project updated successfully', savedProject);
        },
        error: (err) => {
          console.error('Failed to update project', err);
          // Optionally, revert optimistic updates or show an error toast
        },
      });
  }
}
