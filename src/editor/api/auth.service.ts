import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';

/**
 * Service responsible for handling authentication-related API requests
 * and managing the local session state.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly apiUrl = 'http://localhost:5000/api/auth';
  private readonly http = inject(HttpClient);

  /**
   * Registers a new user.
   * @param user The user registration details.
   * @returns An observable of the registration response.
   */
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  /**
   * Authenticates a user and sets the local session state upon success.
   * Note: The actual JWT is handled securely via HttpOnly cookies by the backend.
   * @param credentials The user's login credentials.
   * @returns An observable of the login response.
   */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap(() => {
        localStorage.setItem('isLoggedIn', 'true');
      })
    );
  }

  /**
   * Logs out the user by notifying the backend to clear the HttpOnly cookie
   * and clears the local session state.
   * @returns An observable of the logout response.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => {
        this.clearLocalSession();
      })
    );
  }

  /**
   * Checks if the user is currently logged in based on the local state flag.
   * @returns True if the user is logged in, false otherwise.
   */
  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  /**
   * Clears the local session state flag.
   */
  clearLocalSession(): void {
    localStorage.removeItem('isLoggedIn');
  }
}
