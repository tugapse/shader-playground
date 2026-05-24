import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

/**
 * Intercepts HTTP requests to automatically include the authentication token
 * and handles global unauthorized (401) errors by redirecting to the login page.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Intercepts outgoing HTTP requests.
   * @param request The outgoing HTTP request.
   * @param next The next interceptor in the chain, or the backend if no interceptors remain.
   * @returns An observable of the HTTP event stream.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let clonedRequest = request;
    const token = this.authService.getToken();

    if (token) {
      clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.clearLocalSession();
          this.router.navigate(['/login']);
        }

        // Pass the error back to the calling service for specific handling
        return throwError(() => error);
      })
    );
  }
}