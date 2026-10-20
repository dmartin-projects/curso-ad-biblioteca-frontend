import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { Almacenamiento, AlmacenamientoLocal } from './core/almacenamiento';
import { APP_CONFIG } from './core/config';
import { provideLocaleEs } from './core/locale';
import { TituloConSufijo } from './core/titulo';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules),
      withNavigationErrorHandler((e) => console.error('Error de navegación', e.error)),
    ),
    { provide: TitleStrategy, useClass: TituloConSufijo },
    ...provideLocaleEs(),
    {
      provide: APP_CONFIG,
      useValue: { apiUrl: environment.apiUrl, wsUrl: environment.wsUrl, paginaPorDefecto: 20 },
    },
    { provide: Almacenamiento, useClass: AlmacenamientoLocal },
  ],
};
