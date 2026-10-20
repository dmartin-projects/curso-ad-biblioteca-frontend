import { Component, computed, signal } from '@angular/core';
import { FiltrarPorPipe } from '../../shared/pipes/filtrar-por';

export interface GastoDemo {
  id: number;
  categoria: string;
}

/** Ejercicio 4: pipe puro + mutación (no se actualiza) frente a datos inmutables y computed. */
@Component({
  selector: 'app-demo-filtrar',
  imports: [FiltrarPorPipe],
  templateUrl: './demo-filtrar.html',
})
export class DemoFiltrar {
  readonly gastos = signal<GastoDemo[]>([
    { id: 1, categoria: 'super' },
    { id: 2, categoria: 'ocio' },
  ]);
  readonly categoria = signal('super');
  /** La alternativa recomendada: derivar datos con computed. */
  readonly filtrados = computed(() =>
    this.gastos().filter((g) => g.categoria === this.categoria()),
  );

  anadirMutando(g: GastoDemo) {
    this.gastos().push(g); // ❌ misma referencia: ni el pipe puro ni el computed se enteran
  }

  anadirInmutable(g: GastoDemo) {
    this.gastos.update((l) => [...l, g]); // ✅ referencia nueva
  }
}
