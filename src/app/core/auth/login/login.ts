import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ErrorApi } from '../../http/errores';
import { AuthStore } from '../auth-store';
import { destinoSeguro } from '../destino';

/** Login contra /api/v1/auth/login/ (el formulario con Signal Forms llega en el módulo 53). */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
})
export default class Login {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  /** ?next=/prestamos (llega como input gracias a withComponentInputBinding) */
  readonly next = input<string>();
  protected readonly error = signal('');
  protected readonly enviando = signal(false);

  protected async entrar(evento: Event, email: string, password: string): Promise<void> {
    evento.preventDefault();
    this.enviando.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.auth.login(email, password));
      // solo rutas internas: ?next=https://malo.example no debe sacarnos de la app
      await this.router.navigateByUrl(destinoSeguro(this.next()), { replaceUrl: true });
    } catch (e) {
      // 401: mismo mensaje tanto si el email no existe como si la contraseña es mala (módulo 35)
      if (e instanceof ErrorApi && e.status === 401)
        this.error.set('Email o contraseña incorrectos.');
      else if (e instanceof ErrorApi)
        this.error.set(e.titulo); // 429 (throttle), sin conexión…
      else this.error.set('No se pudo iniciar sesión.');
    } finally {
      this.enviando.set(false);
    }
  }
}
