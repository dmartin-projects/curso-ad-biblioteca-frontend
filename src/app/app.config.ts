import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  PLATFORM_ID,
} from '@angular/core';
import {
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
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthStore } from './core/auth/auth-store';
import { cabecerasInterceptor } from './core/http/cabeceras';
import { erroresInterceptor } from './core/http/errores';
import { reintentosInterceptor } from './core/http/reintentos';
import { cacheInterceptor } from './core/http/cache';
import { APP_CONFIG } from './core/config';
import { provideLocaleEs } from './core/locale';
import { TituloConSufijo } from './core/titulo';
import { PrecargaSeleccionada } from './core/precarga';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withXhr(), // progreso de subida (fetch no lo da); con SSR también funciona (xhr2, módulo 58)
      // petición:  cabeceras → errores → caché → reintentos → auth → servidor
      // respuesta: servidor → auth (refresca si 401) → reintentos → caché (guarda) → errores → cabeceras
      withInterceptors([
        cabecerasInterceptor,
        erroresInterceptor,
        cacheInterceptor, // lo cacheado no llega a la red (ni pasa por reintentos ni auth)
        reintentosInterceptor,
        authInterceptor,
      ]),
    ),
    // antes de la primera navegación: si hay cookie de refresh, recupera la sesión. Solo en el
    // navegador: la sesión (cookie y access en memoria) es suya; en un servidor no hay qué restaurar
    provideAppInitializer(() =>
      isPlatformBrowser(inject(PLATFORM_ID)) ? inject(AuthStore).restaurarSesion() : undefined,
    ),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withPreloading(PrecargaSeleccionada), // módulo 57: solo las rutas con data.precargar
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
