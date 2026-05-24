import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ProjectService } from '../../api/services/project.service';
import { ProjectResponse } from '../../api/models/omega-api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private readonly projectService = inject(ProjectService);

  projects: ProjectResponse[] = [];
  selectedProject: ProjectResponse | null = null;
  isCreatingProject = false;

  projectForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.listProjects().subscribe((projects) => {
      this.projects = projects;
    });
  }

  selectProject(project: ProjectResponse): void {
    this.selectedProject = project;
    this.isCreatingProject = false;
  }

  showCreateProjectForm(): void {
    this.selectedProject = null;
    this.isCreatingProject = true;
    this.projectForm.reset();
  }

  cancelCreateProject(): void {
    this.isCreatingProject = false;
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      // TODO: Implement the actual save logic with the service
      console.log('Saving project:', this.projectForm.value);
      this.isCreatingProject = false;
      // For now, just log and reload projects
      this.loadProjects();
    }
  }
}