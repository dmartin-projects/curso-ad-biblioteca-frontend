import { Routes } from '@angular/router';
import { autenticadoGuard, rolGuard } from './core/auth/guards';
import { provideCatalogo } from './features/catalogo/catalogo.config';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./core/auth/login/login'),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout-privado'),
    canActivate: [autenticadoGuard],
    children: [
      {
        path: 'catalogo',
        providers: [provideCatalogo({ tamanoPagina: 12 })], // compartido por las páginas del catálogo
        loadChildren: () => import('./features/catalogo/catalogo.routes'),
      },
      {
        path: 'gastos', // módulo 54: gastos del hogar activo
        title: 'Gastos',
        loadComponent: () => import('./features/gastos/pages/gastos-page/gastos-page'),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/gastos/pages/listado-gastos/listado-gastos').then(
                (m) => m.ListadoGastos,
              ),
          },
        ],
      },
      {
        path: 'gastos/nuevo', // formulario de gasto del módulo 53 (sin backend todavía)
        title: 'Nuevo gasto',
        loadComponent: () => import('./features/gastos/pages/nuevo-gasto/nuevo-gasto'),
      },
      { path: 'prestamos', loadChildren: () => import('./features/prestamos/prestamos.routes') },
      {
        path: 'admin',
        canMatch: [rolGuard('bibliotecario')],
        loadChildren: () => import('./features/admin/admin.routes'),
      },
      {
        path: 'labs/movimientos', // módulo 55: @for frente a virtual scroll
        loadComponent: () => import('./labs/movimientos/movimientos-lab'),
      },
      {
        path: 'fugas', // laboratorio del módulo 48
        loadComponent: () => import('./labs/fugas/lab-fugas').then((m) => m.LabFugas),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado',
    loadComponent: () => import('./core/no-encontrado/no-encontrado'),
  },
];
