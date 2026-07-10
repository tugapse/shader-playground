import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api-url.token';
import { HealthStatusResponse } from '../models/omega-api.models';

/**
 * Service for handling system health checks.
 */
@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private readonly baseUrl: string;

  constructor() {
    // The health check endpoint is at /health, without the /api/v1 prefix.
    // We must derive the base URL from the full API URL provided by the token.
    this.baseUrl = this.apiUrl.replace('/api/v1', '');
  }

  /**
   * Performs a health check against the server.
   * Note: This endpoint does not use the standard /api/v1 prefix.
   * @returns An observable with the health status.
   */
  checkHealth(): Observable<HealthStatusResponse> {
    const healthUrl = `${this.baseUrl}/health`;
    return this.http.get<HealthStatusResponse>(healthUrl);
  }
}