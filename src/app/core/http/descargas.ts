import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, tap } from 'rxjs';

/** Descarga con HttpClient (lleva el token) y la ofrece al usuario como archivo. */
@Service()
export class Descargas {
  private readonly http = inject(HttpClient);

  descargar(url: string, nombrePorDefecto: string): Observable<unknown> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      tap((r) => {
        const nombre =
          nombreDeContentDisposition(r.headers.get('Content-Disposition')) ?? nombrePorDefecto;
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(r.body!);
        enlace.download = nombre;
        enlace.click();
        // libera la memoria del blob, con margen: si se revoca antes de que el navegador empiece
        // la descarga (Firefox), la cancela
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
      }),
    );
  }
}

export function nombreDeContentDisposition(cabecera: string | null): string | null {
  const m = cabecera?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return m ? decodeURIComponent(m[1]) : null;
}
