import { Routes } from '@angular/router';
import { provideCatalogo } from './features/catalogo/catalogo.config';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'catalogo',
    providers: [provideCatalogo({ tamanoPagina: 2 })], // pequeño para ver la paginación
    loadComponent: () =>
      import('./features/catalogo/pages/catalogo-page/catalogo-page').then((m) => m.CatalogoPage),
  },
];
