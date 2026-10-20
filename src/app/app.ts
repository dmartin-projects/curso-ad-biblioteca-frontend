import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AvisosGlobales } from './core/avisos/avisos-globales/avisos-globales';
import { Actualizaciones } from './core/pwa/pwa';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisosGlobales],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    inject(Actualizaciones).iniciar(); // módulo 61: aviso de versión nueva
  }

  /** Indicador global de "navegando…" (resolvers lentos, chunks que se descargan). */
  protected readonly navegando = toSignal(
    inject(Router).events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}
