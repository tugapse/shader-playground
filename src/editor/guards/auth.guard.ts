import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthApiService } from '../api/auth.service';

/**
 * Route guard that checks if a user is authenticated.
 * Redirects to the login page if the user is not logged in.
 *
 * @param route The activated route snapshot.
 * @param state The router state snapshot.
 * @returns True if authenticated, or a UrlTree redirecting to the login page.
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};
