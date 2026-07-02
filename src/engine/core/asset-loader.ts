import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetLoader {
  private http = inject(HttpClient);

  // Update this to your production backend domain
  private baseUrl = 'http://localhost:3000';

  /**
   * Resolves the real remote path based on the user and project context
   */
  private getFullUrl(
    user: string,
    project: string,
    relativePath: string,
  ): string {
    // Transforms "assets/texture/someimage.png" into "storage/USER/PROJECT/assets/texture/someimage.png"
    return `${this.baseUrl}/storage/${user}/${project}/${relativePath}`;
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'X-User-Project-Token': token,
    });
  }

  /**
   * Loads Text Files (GLSL Shaders, Custom Scripts, JSON configs)
   */
  loadText(
    user: string,
    project: string,
    token: string,
    path: string,
  ): Observable<string> {
    const url = this.getFullUrl(user, project, path);
    const headers = this.getAuthHeaders(token);

    return this.http.get(url, { headers, responseType: 'text' });
  }

  /**
   * Loads Binary Files (Textures, Images, Audio Clips)
   * Converts the response into a local blob URL that native contexts read instantly.
   */
  loadBinary(
    user: string,
    project: string,
    token: string,
    path: string,
  ): Observable<string> {
    const url = this.getFullUrl(user, project, path);
    const headers = this.getAuthHeaders(token);

    return this.http
      .get(url, { headers, responseType: 'blob' })
      .pipe(map((blob) => URL.createObjectURL(blob)));
  }

  /**
   * Clean up binary object allocations to prevent memory leaks
   */
  revokeUrl(blobUrl: string): void {
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
