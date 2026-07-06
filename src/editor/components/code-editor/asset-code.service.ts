import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from 'src/app/api/api-url.token';

export interface WorkspaceNode {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  children?: WorkspaceNode[];
}

export interface FileContentResult {
  path: string;
  content: string;
  language: string;
}

export interface CompileError {
  text: string;
}

export interface CompileResult {
  success: boolean;
  message: string;
  code: string | null;
  errors: CompileError[] | null;
}

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
    path: string,
    template: string = 'behavior',
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${projectId}/code/files`, {
      path,
      template,
    });
  }

  // 🎯 Upgraded from PATCH delta arrays to atomic PUT content updates
  updateFileContent(
    projectId: string,
    path: string,
    content: string,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${projectId}/code/files`, {
      path,
      content,
    });
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
      { responseType: 'text' },
    );
  }

  compileWorkspace(projectId: string): Observable<CompileResult> {
    return this.http.post<CompileResult>(
      `${this.baseUrl}/${projectId}/code/compile`,
      {},
    );
  }
}
