import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BuscadorAutores } from '../autores/buscador-autores/buscador-autores';
import { ResumenCarrito } from '../carrito/resumen-carrito/resumen-carrito';
import { AuthStore } from '../auth/auth-store';
import { Avisos } from '../avisos/avisos';
import { NotificacionesWs } from '../notificaciones/notificaciones-ws';

/** Layout de la zona privada: cabecera con menú + <router-outlet> para las páginas hijas. */
@Component({
  selector: 'app-layout-privado',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ResumenCarrito, BuscadorAutores],
  templateUrl: './layout-privado.html',
})
export default class LayoutPrivado {
  protected readonly auth = inject(AuthStore);

  constructor() {
    // Notificaciones en tiempo real mientras se está en la zona privada (módulo 25)
    const avisos = inject(Avisos);
    inject(NotificacionesWs)
      .mensajes$.pipe(
        filter((m) => m.tipo === 'notificacion'),
        takeUntilDestroyed(),
      )
      .subscribe((m) => m.tipo === 'notificacion' && avisos.info(m.datos.mensaje));
  }
}
