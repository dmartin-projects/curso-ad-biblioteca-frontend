import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../../core/auth/guards';
import { tituloLibroResolver } from './services/titulo-libro.resolver';

export default [
  {
    path: '',
    title: 'Catálogo',
    loadComponent: () => import('./pages/catalogo-page/catalogo-page'),
  },
  {
    path: 'nuevo',
    title: 'Nuevo libro',
    canDeactivate: [cambiosSinGuardarGuard],
    loadComponent: () => import('./pages/formulario-libro/formulario-libro'),
  },
  {
    path: 'libros/:id/editar',
    title: 'Editar libro',
    canDeactivate: [cambiosSinGuardarGuard],
    loadComponent: () => import('./pages/formulario-libro/formulario-libro'),
  },
  {
    path: 'libros/:id',
    title: tituloLibroResolver,
    loadComponent: () => import('./pages/pagina-detalle-libro/pagina-detalle-libro'),
  },
] satisfies Routes;
