import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Administración',
    loadComponent: () => import('./pages/admin-page/admin-page'),
  },
] satisfies Routes;
