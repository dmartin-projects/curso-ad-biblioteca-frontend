import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanDeactivateFn,
  CanMatchFn,
  RedirectCommand,
  Router,
} from '@angular/router';
import { Confirmaciones } from '../../shared/components/confirmar/confirmaciones';
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

export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambios> = (componente) =>
  !componente.tieneCambios() ||
  inject(Confirmaciones).preguntar('Cambios sin guardar', 'Tienes cambios sin guardar. ¿Salir igualmente?');
