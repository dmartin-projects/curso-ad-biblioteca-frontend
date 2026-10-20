import { Component, input, output } from '@angular/core';
import { Libro } from '../../interfaces/catalogo.models';
import { LibroCard } from '../libro-card/libro-card';

/** Presentación: pinta los libros que le den y avisa de las reservas. Sin servicios. */
@Component({
  selector: 'app-lista-libros',
  imports: [LibroCard],
  templateUrl: './lista-libros.html',
  styleUrl: './lista-libros.scss',
})
export class ListaLibros {
  readonly libros = input.required<readonly Libro[]>();
  readonly termino = input('');
  readonly reservar = output<number>();
}
