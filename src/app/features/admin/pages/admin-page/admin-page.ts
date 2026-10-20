import { Component } from '@angular/core';
import { Dashboard } from '../../../../shared/components/dashboard/dashboard';
import { ConfigWidget } from '../../../../shared/components/dashboard/widgets';

@Component({
  selector: 'app-admin-page',
  imports: [Dashboard],
  templateUrl: './admin-page.html',
})
export default class AdminPage {
  protected readonly widgets: ConfigWidget[] = [
    { id: 1, tipo: 'total', config: { total: 5, etiqueta: 'libros en el catálogo' } },
    { id: 2, tipo: 'aviso', config: { texto: '1 préstamo vence mañana' } },
    { id: 3, tipo: 'lista', config: { lineas: ['Dune', 'Fundación'] } },
  ];
}
