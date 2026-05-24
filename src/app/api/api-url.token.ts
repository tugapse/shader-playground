import { InjectionToken } from '@angular/core';

/**
 * An injection token for the Omega API base URL.
 *
 * Use this token to provide the API URL through Angular's dependency injection system.
 * This allows for easy configuration and swapping of environments (e.g., development, production)
 * without modifying service code.
 *
 * @example
 * providers: [
 *   { provide: API_URL, useValue: 'http://localhost:5000/api/v1' }
 * ]
 */
export const API_URL = new InjectionToken<string>('app.api.url');