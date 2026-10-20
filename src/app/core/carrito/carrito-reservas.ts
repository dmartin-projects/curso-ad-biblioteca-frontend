import { computed, Service, signal } from '@angular/core';

/** Lo que el carrito necesita de un libro: cualquier libro del catálogo lo cumple. */
export interface LibroReservable {
  id: number;
  titulo: string;
  ejemplares_disponibles: number;
}

export interface LineaReserva {
  libro: LibroReservable;
  cantidad: number;
}

@Service() // Angular 22: equivalente a @Injectable({ providedIn: 'root' })
export class CarritoReservas {
  private readonly _lineas = signal<LineaReserva[]>([]);
  readonly lineas = this._lineas.asReadonly(); // fuera solo se lee
  readonly total = computed(() => this._lineas().reduce((s, l) => s + l.cantidad, 0));

  anadir(libro: LibroReservable): void {
    this._lineas.update((lineas) =>
      lineas.some((l) => l.libro.id === libro.id) ? lineas : [...lineas, { libro, cantidad: 1 }],
    );
  }

  cambiarCantidad(id: number, cantidad: number): void {
    this._lineas.update(
      (lineas) => lineas.map((l) => (l.libro.id === id ? { ...l, cantidad } : l)), // nuevo array, no mutar
    );
  }

  quitar(id: number): void {
    this._lineas.update((lineas) => lineas.filter((l) => l.libro.id !== id));
  }
}
