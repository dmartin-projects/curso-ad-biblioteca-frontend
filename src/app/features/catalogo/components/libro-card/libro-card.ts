import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Resaltar } from '../../../../shared/directives/resaltar';
import { Libro } from '../../interfaces/catalogo.models';

@Component({
  selector: 'app-libro-card',
  imports: [DatePipe, Resaltar, RouterLink],
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
  readonly termino = input(''); // para resaltar la búsqueda (módulo 43)
  readonly reservar = output<number>();

  protected readonly agotado = computed(() => this.libro().ejemplares_disponibles === 0);

  protected onReservar(): void {
    this.reservar.emit(this.libro().id);
  }
}
