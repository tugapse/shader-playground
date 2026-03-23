import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private apiUrl = 'http://localhost:5000/api/assets';
  private http = inject(HttpClient);

  // NOVO: Obtém a estrutura em árvore para o Explorador
  getProjectTree(projectId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/project-tree/${projectId}`);
  }

  // NOVO: Atualiza metadados (Renomear ficheiro ou Mover pasta virtual)
  updateMetadata(assetId: string, metadata: { name?: string, virtualPath?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${assetId}/metadata`, metadata);
  }

  // NOVO: Eliminar um asset (ficheiro ou script)
  deleteAsset(assetId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${assetId}`);
  }

  createScript(projectId: string, name: string, path: string = '/'): Observable<any> {
    return this.http.post(`${this.apiUrl}/scripts`, { projectId, name, virtualPath: path });
  }

  uploadAsset(projectId: string, file: File, type: string, path: string = '/'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', type);
    formData.append('virtualPath', path);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getScriptContent(assetId: string): Observable<{ content: string }> {
    return this.http.get<{ content: string }>(`${this.apiUrl}/${assetId}/content`);
  }

  updateScriptContent(assetId: string, content: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${assetId}/content`, { content });
  }
}
