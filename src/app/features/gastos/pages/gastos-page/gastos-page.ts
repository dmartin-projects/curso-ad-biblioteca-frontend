import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HogarStore } from '../../../../core/hogar/hogar-store';
import { HogarStoreClasico } from '../../../../core/hogar/hogar-store-clasico';
import { SelectorHogar } from '../../../../shared/components/selector-hogar/selector-hogar';
import { GastosApiFalsa } from '../../services/gastos-api-falsa';
import { Categoria } from '../../components/selector-categoria/selector-categoria';
import { OrdenCategorias } from '../../components/orden-categorias/orden-categorias';

/** Los gastos del hogar activo: elige el hogar; la lista es su ruta hija (ListadoGastos). */
@Component({
  selector: 'app-gastos-page',
  imports: [SelectorHogar, RouterOutlet, RouterLink, OrdenCategorias],
  templateUrl: './gastos-page.html',
})
export default class GastosPage {
  protected readonly hogar = inject(HogarStore);
  private readonly clasico = inject(HogarStoreClasico);
  private readonly gastosApi = inject(GastosApiFalsa);
  protected readonly categorias = signal<Categoria[]>([
    { id: 1, nombre: 'Súper', color: '#2e7d32' },
    { id: 2, nombre: 'Ocio', color: '#6a1b9a' },
    { id: 3, nombre: 'Casa', color: '#1565c0' },
  ]);
  protected readonly activoClasico = toSignal(this.clasico.activo$, { initialValue: null });

  protected guardarOrden(ids: number[]): void {
    this.gastosApi.guardarOrden(ids).subscribe();
  }

  constructor() {
    void this.hogar.cargar();
    void this.clasico.cargar();
  }
}
