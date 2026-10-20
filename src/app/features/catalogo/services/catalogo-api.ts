import { resource, Service, Signal } from '@angular/core';
import { Libro } from '../interfaces/catalogo.models';

/** El acceso a la API del catálogo: el ÚNICO sitio de la feature que habla HTTP. */
@Service()
export class CatalogoApi {
  /** Se crea en un contexto de inyección (un campo de la página) y recarga cuando cambia el id. */
  libroResource(id: Signal<number>) {
    return resource({
      params: () => ({ id: id() }),
      loader: async ({ params, abortSignal }) => {
        const r = await fetch(`/api/v1/libros/${params.id}/`, { signal: abortSignal });
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return (await r.json()) as Libro;
      },
    });
  }
}
