import { httpResource } from '@angular/common/http';
import { Resource, Service, Signal } from '@angular/core';
import { Categoria, Hogar } from '../interfaces/gastos.models';

/** Lectura de hogares con httpResource. Como todo recurso, se crea en un contexto de inyección. */
@Service()
export class HogaresApi {
  hogar(id: Signal<number>) {
    return httpResource<Hogar>(() => `/api/v1/hogares/${id()}/`);
  }

  /** Hogar → categorías: este recurso depende del VALOR del primero (chain). */
  categorias(hogar: Resource<Hogar | undefined>) {
    return httpResource<Categoria[]>(({ chain }) => {
      const h = chain(hogar); // mientras el hogar carga o falla, este recurso refleja ese estado
      return h ? `/api/v1/hogares/${h.id}/categorias/` : undefined;
    });
  }
}
