import { httpResource } from '@angular/common/http';
import { Service, Signal } from '@angular/core';
import { Autor, Paginado } from '../api/tipos';

/** GET /api/v1/autores/?search= con httpResource. Se llama en un contexto de inyección. */
@Service()
export class AutoresApi {
  /** Busca con 2 letras o más; con menos, el recurso se queda en reposo (sin petición). */
  buscar(termino: Signal<string>, tamano?: number) {
    return httpResource<Paginado<Autor>>(() => {
      const t = termino();
      if (t.length < 2) return undefined;
      const params: Record<string, string | number> = { search: t };
      if (tamano) params['page_size'] = tamano;
      return { url: '/api/v1/autores/', params };
    });
  }
}
