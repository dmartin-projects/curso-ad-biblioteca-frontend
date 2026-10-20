import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth-store';
import { CatalogoApi } from '../../services/catalogo-api';
import { DetalleLibro } from '../../components/detalle-libro/detalle-libro';
import { SubirPortada } from '../../components/subir-portada/subir-portada';

/** /catalogo/libros/:id → el id llega como input (string) y el recurso recarga al cambiar. */
@Component({
  selector: 'app-pagina-detalle-libro',
  imports: [DetalleLibro, RouterLink, SubirPortada],
  templateUrl: './pagina-detalle-libro.html',
})
export default class PaginaDetalleLibro {
  protected readonly auth = inject(AuthStore);
  readonly id = input.required<string>(); // los parámetros de ruta siempre son string
  protected readonly idNumerico = computed(() => Number(this.id()));
  private readonly api = inject(CatalogoApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly libro = this.api.libroResource(this.idNumerico);
  protected readonly portada = signal<string | null>(null);
  protected readonly progreso = signal<number | null>(null);
  protected readonly errorSubida = signal('');

  protected subirPortada(archivo: File): void {
    this.errorSubida.set('');
    this.progreso.set(0);
    this.api
      .subirPortada(this.idNumerico(), archivo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (estado) => {
          if (estado.tipo === 'progreso') {
            this.progreso.set(estado.porcentaje);
          } else {
            this.progreso.set(null);
            this.portada.set(estado.portada);
          }
        },
        error: (e) => {
          this.progreso.set(null);
          this.errorSubida.set(e.titulo ?? 'No se pudo subir la portada.');
        },
      });
  }
}
