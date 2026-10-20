import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  keepPreviousData,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthStore } from '../../../../core/auth/auth-store';
import { cursorDe, EstadoPrestamo, PrestamosApi } from '../../../../core/prestamos/prestamos-api';

/** Ejercicio 5 del módulo 52: los préstamos con TanStack Query. */
@Component({
  selector: 'app-listado-prestamos',
  imports: [DatePipe],
  templateUrl: './listado-prestamos.html',
})
export default class ListadoPrestamos {
  private readonly api = inject(PrestamosApi);
  private readonly queryClient = inject(QueryClient); // injectQueryClient() está deprecado
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

  // Clave = qué datos son. Si cambia (estado, cursor), es otra entrada de caché
  readonly prestamos = injectQuery(() => ({
    queryKey: ['prestamos', this.estado(), this.cursor()],
    queryFn: () => lastValueFrom(this.api.listar({ estado: this.estado(), cursor: this.cursor() })),
    placeholderData: keepPreviousData, // mantiene la página anterior mientras carga la nueva
  }));

  protected readonly siguiente = computed(() => cursorDe(this.prestamos.data()?.next));
  protected readonly anterior = computed(() => cursorDe(this.prestamos.data()?.previous));

  readonly devolver = injectMutation(() => ({
    mutationFn: (id: number) => lastValueFrom(this.api.devolver(id)),
    // invalida TODAS las entradas que empiezan por 'prestamos' (todas las páginas y filtros)
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['prestamos'] }),
  }));
}
