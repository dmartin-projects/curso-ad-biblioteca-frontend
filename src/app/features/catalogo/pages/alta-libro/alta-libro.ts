import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConCambios } from '../../../../core/auth/guards';
import { Autofocus } from '../../../../shared/directives/autofocus';
import { RequierePermiso } from '../../../../core/auth/permisos/requiere-permiso';

/** Esqueleto del alta: el formulario de verdad (Signal Forms) llega en el módulo 53. */
@Component({
  selector: 'app-alta-libro',
  imports: [Autofocus, RequierePermiso],
  templateUrl: './alta-libro.html',
})
export default class AltaLibro implements ConCambios {
  private readonly router = inject(Router);
  readonly sucio = signal(false);

  tieneCambios(): boolean {
    return this.sucio();
  }

  protected guardar(evento: Event): void {
    evento.preventDefault();
    this.sucio.set(false); // guardado (simulado): ya no hay cambios que perder
    this.router.navigateByUrl('/catalogo');
  }

  protected cancelar(): void {
    this.router.navigateByUrl('/catalogo'); // el guard pregunta si hay cambios
  }
}
