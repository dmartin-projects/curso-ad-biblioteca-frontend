import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HogarStore } from '../../../../core/hogar/hogar-store';
import { HogarStoreClasico } from '../../../../core/hogar/hogar-store-clasico';
import { SelectorHogar } from '../../../../shared/components/selector-hogar/selector-hogar';

/** Los gastos del hogar activo: elige el hogar; la lista es su ruta hija (ListadoGastos). */
@Component({
  selector: 'app-gastos-page',
  imports: [SelectorHogar, RouterOutlet, RouterLink],
  templateUrl: './gastos-page.html',
})
export default class GastosPage {
  protected readonly hogar = inject(HogarStore);
  private readonly clasico = inject(HogarStoreClasico);
  protected readonly activoClasico = toSignal(this.clasico.activo$, { initialValue: null });

  constructor() {
    void this.hogar.cargar();
    void this.clasico.cargar();
  }
}
