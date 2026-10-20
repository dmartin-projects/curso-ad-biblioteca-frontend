import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, injectAsync, Service } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, map, merge } from 'rxjs';

/** Módulo 61: avisar de que hay una versión nueva (el service worker sirve la vieja hasta recargar). */
@Service()
export class Actualizaciones {
  private readonly sw = inject(SwUpdate);
  // injectAsync, no inject(MatSnackBar): este servicio arranca con la app, y el snack bar (con su
  // overlay y su portal, ~180 kB) iría al bundle inicial. Se descarga solo si hay versión nueva.
  private readonly snackBar = injectAsync(() =>
    import('@angular/material/snack-bar').then((m) => m.MatSnackBar),
  );
  private readonly documento = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  iniciar(): void {
    if (!this.sw.isEnabled) return; // ng serve, tests, navegadores sin service worker

    this.sw.versionUpdates
      .pipe(
        filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(async () => {
        const snackBar = await this.snackBar();
        snackBar
          .open('Hay una nueva versión de la aplicación', 'Actualizar')
          .onAction()
          .subscribe(() => this.documento.location.reload());
      });

    // la caché del service worker se ha corrompido: lo único sensato es recargar
    this.sw.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.documento.location.reload());

    // una pestaña abierta días enteros también debe enterarse
    interval(6 * 60 * 60 * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sw.checkForUpdate());
  }
}

/** ¿Hay red? (navigator.onLine dice "hay interfaz de red", no "llega el servidor": es una pista). */
@Service()
export class Conexion {
  readonly enLinea = toSignal(
    merge(fromEvent(window, 'online'), fromEvent(window, 'offline')).pipe(
      map(() => navigator.onLine),
    ),
    { initialValue: navigator.onLine },
  );
}

/**
 * Al cerrar sesión: borra las respuestas de la API que guardó el service worker (dataGroups).
 * Se cachean por URL, sin mirar el usuario: sin esto, el siguiente usuario del navegador vería sin
 * conexión los préstamos del anterior. El código de la app (assetGroups) se queda.
 */
export async function borrarDatosCacheados(): Promise<void> {
  if (!globalThis.caches) return;
  const nombres = await caches.keys();
  await Promise.all(nombres.filter((n) => n.includes(':data:')).map((n) => caches.delete(n)));
}
