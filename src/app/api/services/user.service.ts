import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UpdateUserRequest,
  UserPreferences,
  UserResponse,
} from '../models/omega-api.models';
import { API_URL } from '../api-url.token';

/**
 * Service for managing the authenticated user's profile and preferences.
 * All methods require an Authorization header, which should be handled by an HttpInterceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly userUrl = `${this.apiUrl}/users/me`;

  /**
   * Retrieves the authenticated user's profile.
   * Corresponds to `GET /api/users/me`.
   */
  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.userUrl);
  }

  /**
   * Partially updates the user's profile.
   * Corresponds to `PATCH /api/users/me`.
   * @param payload - The fields to update.
   */
  updateMe(payload: UpdateUserRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(this.userUrl, payload);
  }

  /**
   * Retrieves the user's preferences.
   * Corresponds to `GET /api/users/me/preferences`.
   */
  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.userUrl}/preferences`);
  }

  /**
   * Fully replaces the user's preferences.
   * Corresponds to `PUT /api/users/me/preferences`.
   * @param payload - The complete new preferences object.
   */
  updatePreferences(payload: UserPreferences): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(
      `${this.userUrl}/preferences`,
      payload,
    );
  }
}
