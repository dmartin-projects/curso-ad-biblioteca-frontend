import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../core/auth/auth-store';
import {
  cursorDe,
  EstadoPrestamo,
  PaginaPrestamos,
  PrestamosApi,
} from '../../../../core/prestamos/prestamos-api';

/**
 * "Mis préstamos" con los resources de Angular: rxResource para cada página y linkedSignal para
 * seguir viendo la anterior mientras carga la siguiente.
 */
@Component({
  selector: 'app-listado-prestamos',
  imports: [DatePipe],
  templateUrl: './listado-prestamos.html',
})
export default class ListadoPrestamos {
  private readonly api = inject(PrestamosApi);
  private readonly auth = inject(AuthStore);
  protected readonly puedeDevolver = computed(() =>
    this.auth.tienePermiso('prestamos.change_prestamo'),
  );

  readonly estado = signal<EstadoPrestamo | ''>('');
  /** Al cambiar el filtro, vuelve a la primera página (sin cursor). */
  readonly cursor = linkedSignal<string, string | null>({
    source: this.estado,
    computation: () => null,
  });

  readonly prestamos = rxResource({
    params: () => ({ estado: this.estado(), cursor: this.cursor() }),
    stream: ({ params }) => this.api.listar(params),
  });

  /** Lo último que llegó: mientras carga la página siguiente, se sigue viendo la anterior
   * (lo que en TanStack era placeholderData: keepPreviousData). */
  protected readonly datos = linkedSignal<PaginaPrestamos | undefined, PaginaPrestamos | undefined>(
    {
      source: () => (this.prestamos.hasValue() ? this.prestamos.value() : undefined),
      computation: (nuevo, anterior) => nuevo ?? anterior?.value,
    },
  );

  protected readonly siguiente = computed(() => cursorDe(this.datos()?.next));
  protected readonly anterior = computed(() => cursorDe(this.datos()?.previous));
  protected readonly devolviendo = signal(false);

  async devolver(id: number): Promise<void> {
    this.devolviendo.set(true);
    try {
      await firstValueFrom(this.api.devolver(id));
      this.prestamos.reload(); // "invalidar" la lista
    } finally {
      this.devolviendo.set(false);
    }
  }
}
