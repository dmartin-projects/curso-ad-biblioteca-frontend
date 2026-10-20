import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaginadorEnEspanol } from '../../../../core/paginador-es';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { CatalogoApi } from '../../services/catalogo-api';

/**
 * Ejercicio 4: tabla con orden y paginación EN EL SERVIDOR y el estado en la URL.
 * (Con los libros: los préstamos usan paginación por cursor, sin números de página ni ?ordering=.)
 */
@Component({
  selector: 'app-tabla-libros',
  // aquí y no en app.config: importar algo de @angular/material/paginator en app.config
  // mete todo el paginador (y mat-select, mat-form-field, @angular/forms…) en el bundle inicial
  providers: [{ provide: MatPaginatorIntl, useClass: PaginadorEnEspanol }],
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './tabla-libros.html',
})
export default class TablaLibros {
  private readonly router = inject(Router);
  protected readonly columnas = ['titulo', 'autores', 'publicado', 'ejemplares_disponibles'];

  // estado en la URL: ?page=2&page_size=50&ordering=-publicado
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  readonly page_size = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly ordering = input('titulo', { transform: (v: string | undefined) => v || 'titulo' });

  protected readonly campoOrden = computed(() => this.ordering().replace('-', ''));
  protected readonly direccion = computed<SortDirection>(() =>
    this.ordering().startsWith('-') ? 'desc' : 'asc',
  );

  protected readonly libros = inject(CatalogoApi).librosResource(
    computed(() => ({ page: this.page(), page_size: this.page_size(), ordering: this.ordering() })),
  );
  protected readonly filas = computed(() =>
    this.libros.hasValue() ? this.libros.value().results : [],
  );
  protected readonly total = computed(() =>
    this.libros.hasValue() ? this.libros.value().count : 0,
  );

  protected ordenar(s: Sort): void {
    const ordering = s.direction ? (s.direction === 'desc' ? '-' : '') + s.active : null;
    this.navegar({ ordering, page: null }); // al cambiar el orden, vuelta a la página 1
  }

  protected paginar(e: PageEvent): void {
    // mat-paginator empieza en 0; DRF, en 1
    this.navegar({ page: e.pageIndex + 1, page_size: e.pageSize });
  }

  private navegar(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
