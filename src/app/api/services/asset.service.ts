import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api-url.token';
import {
  AssetResponse,
  MessageResponse,
  ProjectAssetIndexResponse,
  SceneData,
  UpdateAssetRequest,
  UpdateAssetTextRequest,
} from '../models/omega-api.models';

/**
 * Service for handling all asset-related API interactions within a project.
 * It provides methods for listing, uploading, updating, deleting, and retrieving raw asset content.
 */
@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly baseUrl = `${this.apiUrl}/projects`;

  /**
   * Get an index of the project's assets with aggregation.
   * Corresponds to GET /api/projects/{project_id}/assets
   * @param projectId The ID of the project.
   * @param type Optional filter by asset type.
   * @param dir Optional filter by virtual_path prefix.
   */
  listAssets(
    projectId: string,
    type?: 'code' | 'image' | 'audio' | 'text' | 'raw' | 'scene',
    dir?: string,
  ): Observable<ProjectAssetIndexResponse> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    if (dir) {
      params = params.set('dir', dir);
    }
    const url = `${this.baseUrl}/${projectId}/assets`;
    return this.http.get<ProjectAssetIndexResponse>(url, { params });
  }

  /**
   * Uploads a file to a project.
   * Corresponds to POST /api/projects/{project_id}/assets
   * @param projectId The ID of the project.
   * @param file The file to upload.
   * @param virtualPath The logical path for the asset.
   * @param assetType Explicit override for the asset type.
   */
  uploadAsset(
    projectId: string,
    file: File,
    virtualPath?: string,
    assetType?: string,
  ): Observable<AssetResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (virtualPath) {
      formData.append('virtual_path', virtualPath);
    }
    if (assetType) {
      formData.append('asset_type', assetType);
    }
    const url = `${this.baseUrl}/${projectId}/assets`;
    return this.http.post<AssetResponse>(url, formData);
  }

  /**
   * Updates asset metadata or relocates the file.
   * Corresponds to PATCH /api/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param payload The fields to update.
   */
  updateAsset(
    projectId: string,
    assetId: string,
    payload: UpdateAssetRequest,
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}`;
    return this.http.patch<AssetResponse>(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Deletes an asset from the DB and storage.
   * Corresponds to DELETE /api/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   */
  deleteAsset(
    projectId: string,
    assetId: string,
  ): Observable<MessageResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}`;
    return this.http.delete<MessageResponse>(url);
  }
  /**
   * Streams the raw binary content of an asset.
   * Corresponds to GET /api/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   */
  getRawAssetContent(projectId: string, assetId: string): Observable<Blob> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }
  /**
   * Streams the raw binary content of an asset.
   * Corresponds to GET /api/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   */
  getTextAssetContent(projectId: string, assetId: string): Observable<string> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/text`;
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Updates the text/code content of an asset.
   * Corresponds to PUT /api/projects/{project_id}/assets/{asset_id}/text
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param payload The new text content.
   */
  updateRawAssetContent(
    projectId: string,
    assetId: string,
    payload: UpdateAssetTextRequest,
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/text`;
    return this.http.put<AssetResponse>(url, payload);
  }

  /**
   * Replaces the binary content of an existing asset (images, audio, etc).
   * Corresponds to PUT /api/projects/{project_id}/assets/{asset_id}/raw
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param file The new file to upload.
   */
  updateBinaryAssetContent(
    projectId: string,
    assetId: string,
    file: File,
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/raw`;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<AssetResponse>(url, formData);
  }

  /**
   * Updates the raw JSON content of a scene asset.
   * Corresponds to PUT /api/projects/{project_id}/assets/{asset_id}/text
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param sceneData The new scene data as a JSON object.
   */
  saveSceneAsset(
    projectId: string,
    assetId: string,
    sceneData: SceneData,
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/text`;
    const payload: UpdateAssetTextRequest = {
      text: JSON.stringify(sceneData, null, 2),
    };
    return this.http.put<AssetResponse>(url, payload);
  }
}