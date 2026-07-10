import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api-url.token';
import {
  CreateProjectRequest,
  MessageResponse,
  ProjectAssetIndexResponse,
  ProjectResponse,
  UpdateProjectRequest,
} from '../models/omega-api.models';

/**
 * Service for handling all project-related API interactions.
 * It provides methods for creating, listing, retrieving, updating, and deleting projects.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly projectsUrl = `${this.apiUrl}/projects`;

  /**
   * Creates a new project.
   * Corresponds to POST /api/projects
   * @param payload The data for the new project.
   * @returns An observable of the created project response.
   */
  createProject(payload: CreateProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(this.projectsUrl, payload);
  }

  /**
   * Lists all projects owned by the user.
   * Corresponds to GET /api/projects
   * @returns An observable array of project responses.
   */
  listProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(this.projectsUrl);
  }

  /**
   * Retrieves a specific project by its ID.
   * Corresponds to GET /api/projects/{project_id}
   * @param projectId The UUID of the project.
   * @returns An observable of the project response.
   */
  getProjectById(projectId: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.projectsUrl}/${projectId}`);
  }

  /**
   * Retrieves the asset index for a specific project.
   * Corresponds to GET /api/projects/{project_id}/assets
   * @param projectId The UUID of the project.
   * @returns An observable of the project's asset index.
   */
  getProjectAssets(projectId: string): Observable<ProjectAssetIndexResponse> {
    return this.http.get<ProjectAssetIndexResponse>(`${this.projectsUrl}/${projectId}/assets`);
  }

  /**
   * Partially updates project metadata.
   * Corresponds to PATCH /api/projects/{project_id}
   * @param projectId The UUID of the project.
   * @param payload The fields to update.
   * @returns An observable of the updated project response.
   */
  updateProject(
    projectId: string,
    payload: UpdateProjectRequest,
  ): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(
      `${this.projectsUrl}/${projectId}`,
      payload,
    );
  }

  /**
   * Deletes a project and all associated assets.
   * Corresponds to DELETE /api/projects/{project_id}
   * @param projectId The UUID of the project.
   * @returns An observable with the success message from the API.
   */
  deleteProject(projectId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.projectsUrl}/${projectId}`);
  }
}