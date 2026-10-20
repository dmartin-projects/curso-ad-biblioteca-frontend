import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Prestamo } from '../../../../core/api/tipos';
import { AlVerse } from '../../../../shared/directives/al-verse';
import { PrestamosApi, relativa } from '../../../../core/prestamos/prestamos-api';

/** Módulo 57: scroll infinito SIN virtual scroll, con un centinela observado (AlVerse). */
@Component({
  selector: 'app-historial-simple',
  imports: [DatePipe, AlVerse],
  templateUrl: './historial-simple.html',
})
export default class HistorialSimple {
  private readonly api = inject(PrestamosApi);
  protected readonly items = signal<Prestamo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly siguiente = signal<string | null>('/api/v1/prestamos/'); // signal: la plantilla lo lee

  cargarMas(): void {
    const url = this.siguiente();
    if (this.cargando() || !url) return;
    this.cargando.set(true);
    this.api.pagina(url).subscribe({
      next: (r) => {
        this.items.update((a) => [...a, ...r.results]);
        this.siguiente.set(relativa(r.next));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
