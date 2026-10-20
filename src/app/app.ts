import { Component, inject } from '@angular/core';
import { AuthStore } from './core/auth/auth-store';
import { RouterOutlet } from '@angular/router';
import { BuscadorAutores } from './core/autores/buscador-autores/buscador-autores';
import { ListadoGastos } from './features/gastos/pages/listado-gastos/listado-gastos';
import { Dashboard } from './shared/components/dashboard/dashboard';
import { ConfigWidget } from './shared/components/dashboard/widgets';
import { ResumenCarrito } from './core/carrito/resumen-carrito/resumen-carrito';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BuscadorAutores, ListadoGastos, ResumenCarrito, Dashboard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthStore);

  protected entrarComoBibliotecario(): void {
    // simulado hasta el login de verdad (módulo 51)
    this.auth.iniciarSesion(['catalogo.view_libro', 'catalogo.add_libro', 'catalogo.change_libro']);
  }

  protected readonly widgets: ConfigWidget[] = [
    { id: 1, tipo: 'total', config: { total: 5, etiqueta: 'libros en el catálogo' } },
    { id: 2, tipo: 'aviso', config: { texto: '1 préstamo vence mañana' } },
    { id: 3, tipo: 'lista', config: { lineas: ['Dune', 'Fundación'] } },
  ];
}
