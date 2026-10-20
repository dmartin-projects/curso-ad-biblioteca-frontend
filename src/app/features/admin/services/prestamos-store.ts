import { computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  removeAllEntities,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { Prestamo } from '../../../core/api/tipos';
import { AuthStore } from '../../../core/auth/auth-store';
import { PrestamosApi } from '../../../core/prestamos/prestamos-api';
import { FiltroPrestamos } from '../interfaces/admin.models';

interface EstadoPrestamos {
  filtro: FiltroPrestamos;
  busqueda: string; // sobre los títulos ya cargados (la API de préstamos no tiene ?search=)
  cargando: boolean;
  error: string | null;
}
const INICIAL: EstadoPrestamos = { filtro: 'activos', busqueda: '', cargando: false, error: null };
/** Filtro de la pantalla → consulta a la API. */
const CONSULTA = {
  activos: { estado: 'activo' },
  vencidos: { vencidos: true },
  todos: {},
} as const;
const vencido = (p: Prestamo, ahora = Date.now()) =>
  p.estado === 'activo' && Date.parse(p.fecha_limite) < ahora;

export const PrestamosStore = signalStore(
  { providedIn: 'root' },
  withState<EstadoPrestamos>(INICIAL),
  withEntities<Prestamo>(), // ids + entityMap + entities()
  withComputed(({ entities, busqueda }) => ({
    visibles: computed(() => {
      const t = busqueda().trim().toLowerCase();
      return t ? entities().filter((p) => p.libro.titulo.toLowerCase().includes(t)) : entities();
    }),
    totalVencidos: computed(() => entities().filter((p) => vencido(p)).length),
  })),
  withMethods((store, api = inject(PrestamosApi)) => ({
    cambiarFiltro(filtro: FiltroPrestamos) {
      patchState(store, { filtro }); // cargar() escucha la signal filtro: recarga sola
    },
    buscar(busqueda: string) {
      patchState(store, { busqueda });
    },
    // rxMethod: acepta un valor, una signal o un Observable, con operadores de RxJS.
    // switchMap: si cambias de filtro antes de que responda, la petición anterior se cancela
    cargar: rxMethod<FiltroPrestamos>(
      pipe(
        tap(() => patchState(store, { cargando: true })),
        switchMap((filtro) =>
          api.listar(CONSULTA[filtro]).pipe(
            tapResponse({
              next: (r) =>
                patchState(store, setAllEntities(r.results), { cargando: false, error: null }),
              error: () =>
                patchState(store, {
                  cargando: false,
                  error: 'No se pudieron cargar los préstamos',
                }),
            }),
          ),
        ),
      ),
    ),
    async devolver(id: number) {
      const p = await firstValueFrom(api.devolver(id));
      patchState(store, updateEntity({ id, changes: { estado: p.estado } }));
    },
    reiniciar() {
      patchState(store, removeAllEntities(), INICIAL);
    },
  })),
  withHooks({
    onInit(store) {
      store.cargar(store.filtro); // con una signal: se vuelve a cargar cada vez que cambia el filtro
      inject(AuthStore)
        .sesionCerrada$.pipe(takeUntilDestroyed())
        .subscribe(() => store.reiniciar());
    },
  }),
);
