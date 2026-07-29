import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { retryInterceptor } from './core/interceptors/retry.interceptor';
import { SettingsService } from './core/settings/settings.service';
import { PlayerService } from './core/player/player.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([retryInterceptor])),
    provideAppInitializer(() => {
      // Instantiate settings early so the chosen theme/motion apply before first paint.
      inject(SettingsService);
      return inject(PlayerService).init();
    }),
  ],
};
