import { CurrencyPipe, formatCurrency } from '@angular/common';
import { Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import {
  applyEach,
  form,
  FormField,
  FormRoot,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { Avisos } from '../../../../core/avisos/avisos';
import {
  Categoria,
  SelectorCategoria,
} from '../../components/selector-categoria/selector-categoria';

interface Linea {
  descripcion: string;
  cantidad: number;
  precio: number;
}
interface Gasto {
  fecha: string;
  comercio: string;
  categoria: number | null;
  lineas: Linea[];
}

const hoy = () => new Date().toISOString().slice(0, 10);
const lineaVacia = (): Linea => ({ descripcion: '', cantidad: 1, precio: 0 });

/** Ejercicios 3 y 4: líneas dinámicas con applyEach, total calculado y un control propio. */
@Component({
  selector: 'app-nuevo-gasto',
  imports: [FormField, FormRoot, CurrencyPipe, SelectorCategoria],
  templateUrl: './nuevo-gasto.html',
})
export default class NuevoGasto {
  private readonly avisos = inject(Avisos);
  private readonly locale = inject(LOCALE_ID);
  protected readonly categorias: Categoria[] = [
    { id: 1, nombre: 'Súper', color: '#2e7d32' },
    { id: 2, nombre: 'Ocio', color: '#6a1b9a' },
    { id: 3, nombre: 'Casa', color: '#1565c0' },
  ];

  readonly modelo = signal<Gasto>({
    fecha: hoy(),
    comercio: '',
    categoria: null,
    lineas: [lineaVacia()],
  });

  protected readonly f = form(
    this.modelo,
    (r) => {
      required(r.fecha);
      required(r.comercio);
      required(r.categoria);
      applyEach(r.lineas, (linea) => {
        required(linea.descripcion);
        min(linea.cantidad, 1);
        min(linea.precio, 0);
      });
      validate(r.lineas, ({ value }) =>
        value().length === 0 ? { kind: 'vacio', message: 'Añade al menos una línea' } : null,
      );
    },
    {
      submission: {
        action: async () => {
          // aquí iría el POST a la API de gastos (proyecto final); de momento, un aviso
          const importe = formatCurrency(this.total(), this.locale, '€', 'EUR');
          this.avisos.exito(`Gasto de ${importe} guardado`);
          return null;
        },
      },
    },
  );

  readonly total = computed(() =>
    this.modelo().lineas.reduce((s, l) => s + (l.cantidad ?? 0) * (l.precio ?? 0), 0),
  );

  anadirLinea(): void {
    this.modelo.update((g) => ({ ...g, lineas: [...g.lineas, lineaVacia()] }));
  }

  quitarLinea(i: number): void {
    this.modelo.update((g) => ({ ...g, lineas: g.lineas.filter((_, j) => j !== i) }));
  }
}
