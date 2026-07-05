import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface TextChangeDelta {
  range: { startLine: number; endLine: number };
  text: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssetCodeService {
  private http = inject(HttpClient);
  // 📁 Shifted from '/api/assets' to '/api/projects' to target the file system workspace directly
  private baseUrl = '/api/projects';

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
    template?: string,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${projectId}/code/files`, {
      path,
      template,
    });
  }

  updateFileDelta(
    projectId: string,
    path: string,
    changes: TextChangeDelta[],
  ): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${projectId}/code/files`, {
      path,
      changes,
    });
  }

  deleteFile(projectId: string, path: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${projectId}/code/files?path=${encodeURIComponent(path)}`,
    );
  }
}
