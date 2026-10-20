import { httpResource } from '@angular/common/http';
import { Service, Signal } from '@angular/core';

export interface Autor {
  id: number;
  nombre: string;
  apellidos: string;
  slug: string;
}

/** GET /api/v1/autores/?search= con httpResource. Se llama en un contexto de inyección. */
@Service()
export class AutoresApi {
  /** Busca con 2 letras o más; con menos, el recurso se queda en reposo (sin petición). */
  buscar(termino: Signal<string>) {
    return httpResource<{ count: number; results: Autor[] }>(() => {
      const t = termino();
      return t.length >= 2 ? { url: '/api/v1/autores/', params: { search: t } } : undefined;
    });
  }
}
