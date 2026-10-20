import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Libro } from '../interfaces/catalogo.models';

/** El acceso a la API del catálogo: el ÚNICO sitio de la feature que habla HTTP. */
@Service()
export class CatalogoApi {
  private readonly http = inject(HttpClient);

  /** Recurso reactivo: se crea en un contexto de inyección y recarga cuando cambia el id. */
  libroResource(id: Signal<number | undefined>) {
    return httpResource<Libro>(() => (id() ? `/api/v1/libros/${id()}/` : undefined));
  }

  /** Solo el título de un libro (para el título de la pestaña). */
  titulo(id: number): Observable<string> {
    return this.http.get<{ titulo: string }>(`/api/v1/libros/${id}/`).pipe(map((l) => l.titulo));
  }
}
