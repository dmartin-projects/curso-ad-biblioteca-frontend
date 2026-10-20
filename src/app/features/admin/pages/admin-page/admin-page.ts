import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Descargas } from '../../../../core/http/descargas';
import { GenerosStore } from '../../../../core/generos/generos';
import { Dashboard } from '../../../../shared/components/dashboard/dashboard';
import { ConfigWidget } from '../../../../shared/components/dashboard/widgets';
import { GraficoGeneros } from '../../components/grafico-generos/grafico-generos';
import { PanelPrestamos } from '../../components/panel-prestamos/panel-prestamos';
import { AdminApi } from '../../services/admin-api';
import { PrestamosStore } from '../../services/prestamos-store';

@Component({
  selector: 'app-admin-page',
  imports: [Dashboard, PanelPrestamos, GraficoGeneros],
  templateUrl: './admin-page.html',
})
export default class AdminPage {
  private readonly descargas = inject(Descargas);
  private readonly api = inject(AdminApi);
  /** El mismo store que el filtro del catálogo: una sola petición para las dos pantallas. */
  protected readonly generos = inject(GenerosStore);
  /** Préstamos de toda la biblioteca para el panel del personal (NgRx SignalStore). */
  protected readonly prestamos = inject(PrestamosStore);
  protected readonly descargando = signal(false);

  /** Libros por género para el gráfico: se recalcula cuando cambia la lista de géneros. */
  private readonly cuentas = rxResource({
    params: () => this.generos.generos.value(),
    stream: ({ params: generos }) => this.api.librosPorGenero(generos),
  });
  protected readonly librosPorGenero = computed(() =>
    this.cuentas.hasValue() ? this.cuentas.value() : [],
  );
  protected readonly widgets: ConfigWidget[] = [
    { id: 1, tipo: 'total', config: { total: 5, etiqueta: 'libros en el catálogo' } },
    { id: 2, tipo: 'aviso', config: { texto: '1 préstamo vence mañana' } },
    { id: 3, tipo: 'lista', config: { lineas: ['Dune', 'Fundación'] } },
  ];

  constructor() {
    this.generos.asegurarFrescos();
  }

  protected exportar(): void {
    this.descargando.set(true);
    this.descargas.descargar('/api/v1/prestamos/exportar/', 'prestamos.csv').subscribe({
      complete: () => this.descargando.set(false),
      error: () => this.descargando.set(false), // el aviso lo da el interceptor de errores
    });
  }
}
