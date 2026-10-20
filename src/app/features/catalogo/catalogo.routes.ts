import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../../core/auth/guards';
import { tituloLibroResolver } from './services/titulo-libro.resolver';

export default [
  {
    path: '',
    title: 'Catálogo',
    data: { precargar: true }, // módulo 57
    loadComponent: () => import('./pages/catalogo-page/catalogo-page'),
  },
  {
    path: 'tabla',
    title: 'Catálogo (tabla)',
    loadComponent: () => import('./pages/tabla-libros/tabla-libros'),
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
    data: { precargar: true },
    loadComponent: () => import('./pages/pagina-detalle-libro/pagina-detalle-libro'),
  },
] satisfies Routes;
