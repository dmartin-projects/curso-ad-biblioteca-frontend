import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Mis préstamos',
    loadComponent: () => import('./pages/listado-prestamos/listado-prestamos'),
  },
] satisfies Routes;
