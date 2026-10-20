import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BuscadorAutores } from '../autores/buscador-autores/buscador-autores';
import { ResumenCarrito } from '../carrito/resumen-carrito/resumen-carrito';
import { AuthStore } from '../auth/auth-store';
import { Avisos } from '../avisos/avisos';
import { NotificacionesWs } from '../notificaciones/notificaciones-ws';

/**
 * Layout de la zona privada (módulo 56): barra superior, menú lateral (encima del contenido en
 * móvil, fijo al lado en escritorio) y el <router-outlet> de las páginas hijas.
 */
@Component({
  selector: 'app-layout-privado',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    ResumenCarrito,
    BuscadorAutores,
  ],
  templateUrl: './layout-privado.html',
  styleUrl: './layout-privado.scss',
})
export default class LayoutPrivado {
  protected readonly auth = inject(AuthStore);
  protected readonly esMovil = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 768px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  constructor() {
    // Notificaciones en tiempo real mientras se está en la zona privada (módulo 51)
    const avisos = inject(Avisos);
    inject(NotificacionesWs)
      .mensajes$.pipe(
        filter((m) => m.tipo === 'notificacion'),
        takeUntilDestroyed(),
      )
      .subscribe((m) => m.tipo === 'notificacion' && avisos.info(m.datos.mensaje));
  }
}
