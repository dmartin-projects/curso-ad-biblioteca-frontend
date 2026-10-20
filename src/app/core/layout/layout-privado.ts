import { BreakpointObserver } from '@angular/cdk/layout';
import { afterNextRender, Component, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, pairwise, startWith } from 'rxjs';
import { BuscadorAutores } from '../autores/buscador-autores/buscador-autores';
import { ResumenCarrito } from '../carrito/resumen-carrito/resumen-carrito';
import { AuthStore } from '../auth/auth-store';
import { Avisos } from '../avisos/avisos';
import { Conexion } from '../pwa/pwa';
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
  /** Con el router, href="#principal" navegaría; basta con mover el foco. */
  protected irAlContenido(evento: Event): void {
    evento.preventDefault();
    this.principal().nativeElement.focus();
  }

  protected readonly auth = inject(AuthStore);
  protected readonly conexion = inject(Conexion);
  protected readonly esMovil = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 768px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly principal = viewChild.required<ElementRef<HTMLElement>>('principal');
  private readonly injector = inject(Injector);

  constructor() {
    // módulo 59: al cambiar de PÁGINA, el foco va al <main> (el lector de pantalla empieza a leer
    // la página nueva). Solo si cambia la ruta, no los query params: filtrar el catálogo mientras
    // se escribe en el buscador también es una navegación, y robarle el foco sería un desastre.
    const ruta = (url: string) => url.split(/[?#]/)[0];
    inject(Router)
      .events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => ruta(e.urlAfterRedirects)),
        startWith(ruta(inject(Router).url)),
        pairwise(),
        filter(([antes, ahora]) => antes !== ahora),
        takeUntilDestroyed(),
      )
      .subscribe(() =>
        afterNextRender(() => this.principal().nativeElement.focus(), { injector: this.injector }),
      );

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
