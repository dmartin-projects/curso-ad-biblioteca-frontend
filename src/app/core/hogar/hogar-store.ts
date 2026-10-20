import { computed, effect, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Almacenamiento } from '../almacenamiento';
import { AuthStore } from '../auth/auth-store';
import { Hogar, HogaresApiFalsa } from './hogares-api-falsa';

interface EstadoHogar {
  hogares: Hogar[];
  activoId: number | null;
  cargando: boolean;
}

const CLAVE = 'hogarActivo';

@Service()
export class HogarStore {
  private readonly api = inject(HogaresApiFalsa);
  private readonly almacen = inject(Almacenamiento); // módulo 45

  // 1. Estado privado y escribible
  private readonly estado = signal<EstadoHogar>({
    hogares: [],
    activoId: Number(this.almacen.leer(CLAVE)) || null,
    cargando: false,
  });

  // 2. Selectores públicos (solo lectura)
  readonly hogares = computed(() => this.estado().hogares);
  readonly cargando = computed(() => this.estado().cargando);
  readonly activo = computed(() => {
    const { hogares, activoId } = this.estado();
    return hogares.find((h) => h.id === activoId) ?? hogares[0] ?? null;
  });
  readonly soyAdmin = computed(() => this.activo()?.mi_rol === 'admin');

  constructor() {
    // 3. Efectos de sincronización con el exterior
    effect(() => {
      const id = this.activo()?.id;
      if (id) this.almacen.guardar(CLAVE, String(id));
    });
    // al cerrar sesión, a cero (desacoplado: AuthStore no conoce a este store)
    inject(AuthStore)
      .sesionCerrada$.pipe(takeUntilDestroyed())
      .subscribe(() => this.reiniciar());
  }

  // 4. Acciones: la única forma de cambiar el estado
  async cargar(): Promise<void> {
    this.estado.update((s) => ({ ...s, cargando: true }));
    try {
      const hogares = await firstValueFrom(this.api.listar());
      this.estado.update((s) => ({ ...s, hogares, cargando: false }));
    } catch (e) {
      this.estado.update((s) => ({ ...s, cargando: false }));
      throw e;
    }
  }

  seleccionar(id: number): void {
    this.estado.update((s) => ({ ...s, activoId: id }));
  }

  async crear(nombre: string): Promise<void> {
    const hogar = await firstValueFrom(this.api.crear({ nombre }));
    this.estado.update((s) => ({ ...s, hogares: [...s.hogares, hogar], activoId: hogar.id }));
  }

  reiniciar(): void {
    this.estado.set({ hogares: [], activoId: null, cargando: false });
    this.almacen.guardar(CLAVE, ''); // el siguiente usuario no hereda el hogar activo
  }
}
