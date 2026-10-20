import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { Almacenamiento, AlmacenamientoLocal } from './core/almacenamiento';
import { APP_CONFIG } from './core/config';
import { provideLocaleEs } from './core/locale';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...provideLocaleEs(),
    {
      provide: APP_CONFIG,
      useValue: { apiUrl: environment.apiUrl, wsUrl: environment.wsUrl, paginaPorDefecto: 20 },
    },
    { provide: Almacenamiento, useClass: AlmacenamientoLocal },
  ],
};
