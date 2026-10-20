import { Service } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Módulo 57: precargar solo las rutas marcadas con data: { precargar: true }. PreloadAllModules
 * descarga TODAS las rutas diferidas al arrancar (Chart.js y laboratorios incluidos).
 */
@Service()
export class PrecargaSeleccionada implements PreloadingStrategy {
  preload(route: Route, cargar: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['precargar'] ? cargar() : of(null);
  }
}
