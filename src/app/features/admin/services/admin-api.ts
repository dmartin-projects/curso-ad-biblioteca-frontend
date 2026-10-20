import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { Paginado } from '../../../core/api/tipos';
import { Genero } from '../../../core/generos/generos';
import { LibrosPorGenero } from '../interfaces/admin.models';

/** Consultas de la administración. */
@Service()
export class AdminApi {
  private readonly http = inject(HttpClient);

  /** Libros por género: una petición con page_size=1 por género (solo nos interesa count). */
  librosPorGenero(generos: readonly Genero[]): Observable<LibrosPorGenero[]> {
    if (generos.length === 0) return of([]);
    return forkJoin(
      generos.map((g) =>
        this.http
          .get<Paginado<unknown>>('/api/v1/libros/', { params: { genero: g.id, page_size: 1 } })
          .pipe(map((r) => ({ genero: g.nombre, libros: r.count }))),
      ),
    );
  }
}
