import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ErrorApi } from '../../http/errores';
import { AuthStore } from '../auth-store';
import { destinoSeguro } from '../destino';

/** Login con formularios reactivos tipados (módulo 53, parte B). */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export default class Login {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable; // reset() vuelve a '', no a null
  /** ?next=/prestamos (llega como input gracias a withComponentInputBinding) */
  readonly next = input<string>();
  protected readonly error = signal('');
  protected readonly enviando = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required], // la longitud mínima se exige al registrarse, no al entrar
  });

  private readonly email = viewChild.required<ElementRef<HTMLInputElement>>('email');
  private readonly password = viewChild.required<ElementRef<HTMLInputElement>>('password');

  protected mostrarError(campo: 'email' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  protected async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // el foco, al primer campo que falla: quien usa lector de pantalla oye qué pasa
      const primero = this.form.controls.email.invalid ? this.email : this.password;
      primero().nativeElement.focus();
      return;
    }
    const { email, password } = this.form.getRawValue(); // tipado: { email: string; password: string }
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
