import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../auth-store';
import { destinoSeguro } from '../destino';

const PERMISOS_BIBLIOTECARIO = [
  'catalogo.view_libro',
  'catalogo.add_libro',
  'catalogo.change_libro',
  'catalogo.delete_libro',
];

/** Login simulado (el de verdad, contra /api/v1/auth/login/, llega en el módulo 51). */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
})
export default class Login {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  /** ?next=/prestamos (llega como input gracias a withComponentInputBinding) */
  readonly next = input<string>();
  protected readonly permisosBiblio = PERMISOS_BIBLIOTECARIO;

  protected entrar(permisos: string[], roles: string[]): void {
    this.auth.iniciarSesion(['catalogo.view_libro', ...permisos], roles);
    // solo rutas internas: ?next=https://malo.example no debe sacarnos de la app
    this.router.navigateByUrl(destinoSeguro(this.next()), { replaceUrl: true });
  }
}
