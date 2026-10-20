import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Mis préstamos',
    loadComponent: () => import('./pages/listado-prestamos/listado-prestamos'),
  },
  {
    path: 'historial',
    title: 'Historial de préstamos',
    loadComponent: () => import('./pages/historial-prestamos/historial-prestamos'),
  },
] satisfies Routes;
