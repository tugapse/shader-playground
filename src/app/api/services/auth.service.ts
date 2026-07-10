import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AuthLoginRequest,
  AuthLogoutRequest,
  AuthRegisterRequest,
  LoginResponse,
  MessageResponse,
  UserResponse,
} from '../models/omega-api.models';
import { API_URL } from '../api-url.token';

/**
 * Service for handling user authentication (registration, login, logout).
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  // API_URL is '.../api/v1', so we append '/auth'
  private readonly authUrl = `${this.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'omega-auth-token';

  /**
   * Registers a new user.
   * Corresponds to `POST /api/auth/register`.
   * @param payload - The user registration data.
   */
  register(payload: AuthRegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.authUrl}/register`, payload);
  }

  /**
   * Logs in an existing user, storing the token upon success.
   * Corresponds to `POST /api/auth/login`.
   * @param payload - The user login credentials.
   */
  login(payload: AuthLoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, payload).pipe(
      tap((response) => {
        // The API returns `access_token`. We'll use it as the standard JWT.
        if (response.accessToken && typeof localStorage !== 'undefined') {
          localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        }
      }),
    );
  }

  /**
   * Logs out the current user and clears the local session.
   * Corresponds to `POST /api/auth/logout`.
   * Note: This requires an Authorization header, which is handled by the AuthInterceptor.
   * @param payload - Optional payload to send with the logout request.
   */
  logout(payload: AuthLogoutRequest = {}): Observable<MessageResponse> {
    // We tap into the observable to clear the session upon successful logout from the API.
    return this.http
      .post<MessageResponse>(`${this.authUrl}/logout`, payload)
      .pipe(tap(() => this.clearLocalSession()));
  }

  /**
   * Retrieves the stored authentication token from local storage.
   * This is used by the AuthInterceptor to add the token to outgoing requests.
   * @returns The token string or null if not found.
   */
  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Checks if a user is currently authenticated by verifying the presence of a token.
   * This is used by the AuthGuard to protect routes.
   * @returns True if a token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Removes the authentication token from local storage.
   * This is called during logout and by the AuthInterceptor on 401 errors.
   */
  clearLocalSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }
}