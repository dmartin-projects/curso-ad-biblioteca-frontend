import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BuscadorAutores } from '../autores/buscador-autores/buscador-autores';
import { ResumenCarrito } from '../carrito/resumen-carrito/resumen-carrito';
import { AuthStore } from '../auth/auth-store';

/** Layout de la zona privada: cabecera con menú + <router-outlet> para las páginas hijas. */
@Component({
  selector: 'app-layout-privado',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ResumenCarrito, BuscadorAutores],
  templateUrl: './layout-privado.html',
})
export default class LayoutPrivado {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
