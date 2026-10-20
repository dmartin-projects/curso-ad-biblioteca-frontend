import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Prestamo } from '../../../../core/api/tipos';
import { PrestamosApi, relativa } from '../../../../core/prestamos/prestamos-api';

/** Ejercicio 3: scroll infinito + virtual scroll sobre la paginación por cursor de DRF. */
@Component({
  selector: 'app-historial-prestamos',
  imports: [ScrollingModule, DatePipe],
  templateUrl: './historial-prestamos.html',
  styleUrl: './historial-prestamos.scss',
})
export default class HistorialPrestamos {
  private readonly api = inject(PrestamosApi);
  private readonly viewport = viewChild.required(CdkVirtualScrollViewport);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<Prestamo[]>([]);
  protected readonly cargando = signal(false);
  protected siguiente: string | null = '/api/v1/prestamos/';
  protected readonly porId = (_: number, p: Prestamo) => p.id;

  constructor() {
    this.cargarMas();
  }

  protected alDesplazar(): void {
    const restantes = this.items().length - this.viewport().getRenderedRange().end;
    if (restantes < 20) this.cargarMas(); // a 20 filas del final, pide más
  }

  private cargarMas(): void {
    if (this.cargando() || !this.siguiente) return;
    this.cargando.set(true);
    // si el usuario se va a mitad de carga, la request se cancela (módulo 48). Un 503 se reintenta
    // (reintentosInterceptor, módulo 51): mientras tanto, la fila "Cargando…" sigue ahí
    this.api
      .pagina(this.siguiente)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.items.update((actuales) => [...actuales, ...r.results]);
          this.siguiente = relativa(r.next);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
