import { Component, inject, signal } from '@angular/core';
import { Descargas } from '../../../../core/http/descargas';
import { Dashboard } from '../../../../shared/components/dashboard/dashboard';
import { ConfigWidget } from '../../../../shared/components/dashboard/widgets';

@Component({
  selector: 'app-admin-page',
  imports: [Dashboard],
  templateUrl: './admin-page.html',
})
export default class AdminPage {
  private readonly descargas = inject(Descargas);
  protected readonly descargando = signal(false);
  protected readonly widgets: ConfigWidget[] = [
    { id: 1, tipo: 'total', config: { total: 5, etiqueta: 'libros en el catálogo' } },
    { id: 2, tipo: 'aviso', config: { texto: '1 préstamo vence mañana' } },
    { id: 3, tipo: 'lista', config: { lineas: ['Dune', 'Fundación'] } },
  ];

  protected exportar(): void {
    this.descargando.set(true);
    this.descargas.descargar('/api/v1/prestamos/exportar/', 'prestamos.csv').subscribe({
      complete: () => this.descargando.set(false),
      error: () => this.descargando.set(false), // el aviso lo da el interceptor de errores
    });
  }
}
