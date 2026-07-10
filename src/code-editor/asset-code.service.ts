import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from 'src/app/api/api-url.token';
import {
  CompileResult,
  CreateFileRequest,
  FileContentResult,
  UpdateFileContentRequest,
  WorkspaceNode,
} from './asset-code.models';

@Injectable({
  providedIn: 'root',
})
export class AssetCodeService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private get baseUrl(): string {
    if (this.apiUrl.endsWith('/api')) {
      return `${this.apiUrl}/projects`;
    }
    return `${this.apiUrl}/api/projects`;
  }

  // 🎯 Reverted: frontend doesn't pass userUuid anymore
  getWorkspaceTree(projectId: string): Observable<WorkspaceNode> {
    return this.http.get<WorkspaceNode>(
      `${this.baseUrl}/${projectId}/code/tree`,
    );
  }

  getFileContent(
    projectId: string,
    path: string,
  ): Observable<FileContentResult> {
    return this.http.get<FileContentResult>(
      `${this.baseUrl}/${projectId}/code/files?path=${encodeURIComponent(path)}`,
    );
  }

  createFile(
    projectId: string,
    payload: CreateFileRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${projectId}/code/files`,
      payload,
    );
  }

  updateFileContent(
    projectId: string,
    payload: UpdateFileContentRequest,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${projectId}/code/files`,
      payload,
    );
  }

  deleteFile(projectId: string, path: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${projectId}/code/files?path=${encodeURIComponent(path)}`,
    );
  }

  getEngineTypings(projectId: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/${projectId}/code/engine-typings`, {
      responseType: 'text',
    });
  }

  getWorkspaceTypings(projectId: string): Observable<string> {
    return this.http.get(
      `${this.baseUrl}/${projectId}/code/workspace-typings`,
      {
        responseType: 'text',
      },
    );
  }

  compileWorkspace(projectId: string): Observable<CompileResult> {
    return this.http.post<CompileResult>(
      `${this.baseUrl}/${projectId}/code/compile`,
      {},
    );
  }
}
