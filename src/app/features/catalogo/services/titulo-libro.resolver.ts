import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogoApi } from './catalogo-api';

/** Título dinámico: "Dune · Biblioteca". Si la API falla, un título genérico (no bloquea). */
export const tituloLibroResolver: ResolveFn<string> = (route) =>
  inject(CatalogoApi)
    .titulo(Number(route.paramMap.get('id')))
    .pipe(catchError(() => of('Libro')));
