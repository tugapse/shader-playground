import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api-url.token';
import {
  AssetResponse,
  ProjectAssetIndexResponse,
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
   * Corresponds to GET /api/v1/projects/{project_id}/assets
   * @param projectId The ID of the project.
   * @param type Optional filter by asset type.
   * @param dir Optional filter by virtual_path prefix.
   */
  listAssets(
    projectId: string,
    type?: 'code' | 'image' | 'audio' | 'text' | 'raw',
    dir?: string
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
   * Corresponds to POST /api/v1/projects/{project_id}/assets
   * @param projectId The ID of the project.
   * @param file The file to upload.
   * @param virtualPath The logical path for the asset.
   * @param assetType Explicit override for the asset type.
   */
  uploadAsset(
    projectId: string,
    file: File,
    virtualPath?: string,
    assetType?: string
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
   * Corresponds to PATCH /api/v1/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param payload The fields to update.
   */
  updateAsset(
    projectId: string,
    assetId: string,
    payload: {
      virtual_path?: string;
      asset_type?: 'code' | 'image' | 'audio' | 'text' | 'raw';
    }
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}`;
    return this.http.patch<AssetResponse>(url, payload);
  }

  /**
   * Deletes an asset from the DB and storage.
   * Corresponds to DELETE /api/v1/projects/{project_id}/assets/{asset_id}
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   */
  deleteAsset(
    projectId: string,
    assetId: string
  ): Observable<{ status: string; message: string }> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}`;
    return this.http.delete<{ status: string; message: string }>(url);
  }

  /**
   * Streams the raw binary content of an asset.
   * Corresponds to GET /api/v1/projects/{project_id}/assets/{asset_id}/raw
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   */
  getRawAssetContent(
    projectId: string,
    assetId: string
  ): Observable<Blob> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/raw`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  /**
   * Updates the raw content of an asset.
   * NOTE: This assumes a PUT endpoint exists at the /raw path, which is not in the original documentation.
   * @param projectId The ID of the project.
   * @param assetId The ID of the asset.
   * @param content The new raw content.
   */
  updateRawAssetContent(
    projectId: string,
    assetId: string,
    content: string
  ): Observable<AssetResponse> {
    const url = `${this.baseUrl}/${projectId}/assets/${assetId}/raw`;
    return this.http.put<AssetResponse>(url, content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}