import { ScrollingModule } from '@angular/cdk/scrolling';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';

export interface Movimiento {
  id: number;
  fecha: string;
  concepto: string;
  importe: number;
}

const CONCEPTOS = ['Mercadona', 'Nómina', 'Gasolinera', 'Luz', 'Amazon', 'Farmacia', 'Bizum'];
export function generarMovimientos(n: number): Movimiento[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    fecha: new Date(Date.UTC(2026, 0, 1) + i * 3_600_000).toISOString(),
    concepto: `${CONCEPTOS[i % CONCEPTOS.length]} #${i + 1}`,
    importe: i % 7 === 1 ? 1850 : -((i * 37) % 200) - 1.5,
  }));
}

/** Ejercicio 2: 10.000 filas con @for frente a virtual scroll. */
@Component({
  selector: 'app-movimientos-lab',
  imports: [ScrollingModule, CurrencyPipe, DatePipe],
  templateUrl: './movimientos-lab.html',
  styleUrl: './movimientos-lab.scss',
})
export default class MovimientosLab {
  protected readonly movimientos = generarMovimientos(10_000);
  protected readonly modo = signal<'nada' | 'for' | 'virtual'>('nada');
  protected readonly porId = (_: number, m: Movimiento) => m.id;
}
