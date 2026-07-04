import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

import { routes } from './app.routes';
import { AuthInterceptor } from './api/auth.interceptor';
import { environment } from '../environment';
import { API_URL } from './api/api-url.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Required to enable class-based interceptors in Standalone apps
    provideHttpClient(withInterceptorsFromDi()),
    // Registering the AuthInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    // Provide the API_URL token from the environment
    {
      provide: API_URL,
      useValue: environment.apiUrl + '/api',
    },
  ],
};
