import { HttpClient, HttpContext, httpResource } from '@angular/common/http';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { Observable, share, tap } from 'rxjs';
import type { components } from '../api/schema';
import { CACHEAR, CacheHttp } from '../http/cache';

export type Genero = components['schemas']['Genero'];
const URL_GENEROS = '/api/v1/generos/';

/**
 * Ejercicio 1: varias suscripciones simultáneas → una sola petición. share() comparte la petición
 * en curso y se reinicia al completar: la siguiente suscripción vuelve a pedir (no es una caché).
 */
@Service()
export class GenerosApi {
  private readonly http = inject(HttpClient);

  readonly generos$: Observable<Genero[]> = this.http.get<Genero[]>(URL_GENEROS).pipe(share());

  crear(nombre: string): Observable<Genero> {
    return this.http.post<Genero>(URL_GENEROS, { nombre });
  }
}

/**
 * Ejercicio 2: datos de referencia de toda la app. Servicio raíz → el recurso vive mientras
 * vive la app: navegar entre pantallas no repite la petición.
 */
@Service()
export class GenerosStore {
  private readonly api = inject(GenerosApi);
  private readonly cache = inject(CacheHttp);
  private readonly version = signal(0); // subirla fuerza una recarga
  private cargadoEn = 0;
  private readonly ttl = 5 * 60_000;

  readonly generos = httpResource<Genero[]>(
    () => {
      this.version(); // dependencia: invalidar() recarga
      return {
        url: URL_GENEROS,
        // además, en la caché HTTP 10 min (ejercicio 3): si otra parte de la app pide la
        // misma URL con CACHEAR, no va a la red
        context: new HttpContext().set(CACHEAR, 10 * 60_000),
      };
    },
    { defaultValue: [] },
  );

  readonly porId = computed(() => new Map(this.generos.value().map((g) => [g.id, g])));

  constructor() {
    // apunta cuándo llegaron los datos, para la caducidad
    effect(() => {
      if (this.generos.status() === 'resolved') this.cargadoEn = Date.now();
    });
  }

  /** Llámalo al entrar en una pantalla que los usa: recarga si tienen más de 5 min. */
  asegurarFrescos(): void {
    if (this.cargadoEn && Date.now() - this.cargadoEn > this.ttl) this.invalidar();
  }

  invalidar(): void {
    // ⚠️ si no se vacía también la caché HTTP, la "recarga" la serviría la propia caché
    this.cache.invalidar(URL_GENEROS);
    this.version.update((v) => v + 1);
  }

  /** Tras crear un género: añadirlo localmente sin volver a pedir la lista. */
  anadirLocal(g: Genero): void {
    this.generos.update((lista) => [...lista, g].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  }

  crear(nombre: string): Observable<Genero> {
    return this.api.crear(nombre).pipe(tap((g) => this.anadirLocal(g)));
  }
}
