import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Libro } from '../../interfaces/catalogo.models';

@Component({
  selector: 'app-libro-card',
  imports: [DatePipe],
  templateUrl: './libro-card.html',
  styleUrl: './libro-card.scss',
  host: {
    class: 'libro-card',
    role: 'article',
    '[class.agotado]': 'agotado()',
  },
})
export class LibroCard {
  readonly libro = input.required<Libro>();
  readonly reservar = output<number>();

  protected readonly agotado = computed(() => this.libro().ejemplares_disponibles === 0);

  protected onReservar(): void {
    this.reservar.emit(this.libro().id);
  }
}
