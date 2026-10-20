import { inject, injectAsync } from '@angular/core';
import {
  CanActivateFn,
  CanDeactivateFn,
  CanMatchFn,
  RedirectCommand,
  Router,
} from '@angular/router';
import { AuthStore } from './auth-store';

export const autenticadoGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthStore).autenticado()) return true;
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl(`/login?next=${encodeURIComponent(state.url)}`), {
    replaceUrl: true,
  });
};

/** canMatch: si no tiene el rol, la ruta "no existe" (y su código ni se descarga). */
export const rolGuard =
  (rol: string): CanMatchFn =>
  () =>
    inject(AuthStore).tieneRol(rol);

export interface ConCambios {
  tieneCambios: () => boolean;
}

/**
 * Un CanDeactivateFn puede devolver una Promise: la navegación espera a que el usuario conteste.
 * injectAsync: el guard está en la carga inicial y el Dialog del CDK (~115 kB) no hace falta hasta
 * que hay algo que preguntar.
 */
export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambios> = async (componente) => {
  if (!componente.tieneCambios()) return true;
  const confirmaciones = await injectAsync(() =>
    import('../../shared/components/confirmar/confirmaciones').then((m) => m.Confirmaciones),
  )();
  return confirmaciones.preguntar(
    'Cambios sin guardar',
    'Tienes cambios sin guardar. ¿Salir igualmente?',
  );
};
