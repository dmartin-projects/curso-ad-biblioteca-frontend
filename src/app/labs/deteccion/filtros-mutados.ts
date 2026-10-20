import { Component, input } from '@angular/core';
import { FiltrosLibro } from '../../features/catalogo/interfaces/catalogo.models';

@Component({
  selector: 'app-resumen-filtros',
  templateUrl: './resumen-filtros.html',
})
export class ResumenFiltros {
  readonly filtros = input.required<FiltrosLibro>(); // OnPush (por defecto en Angular 22)
}

/** Ejercicio 2: el padre muta el objeto (❌) o crea uno nuevo (✅). */
@Component({
  selector: 'app-padre-filtros',
  imports: [ResumenFiltros],
  templateUrl: './padre-filtros.html',
})
export class PadreFiltros {
  filtros: FiltrosLibro = { texto: '', soloDisponibles: false };

  mutar(texto: string): void {
    this.filtros.texto = texto; // ❌ misma referencia: el hijo OnPush se salta
  }

  reemplazar(texto: string): void {
    this.filtros = { ...this.filtros, texto }; // ✅ referencia nueva
  }
}
