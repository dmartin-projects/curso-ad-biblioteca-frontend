import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Mis préstamos',
    data: { precargar: true }, // módulo 57
    loadComponent: () => import('./pages/listado-prestamos/listado-prestamos'),
  },
  {
    path: 'historial',
    title: 'Historial de préstamos',
    loadComponent: () => import('./pages/historial-prestamos/historial-prestamos'),
  },
  {
    path: 'historial-simple',
    title: 'Historial de préstamos',
    loadComponent: () => import('./pages/historial-simple/historial-simple'),
  },
] satisfies Routes;
