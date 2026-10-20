import { computed, Service, signal } from '@angular/core';

export interface UsuarioSimulado {
  nombre: string;
  roles: readonly string[];
  permisos: readonly string[];
}

/** Simulado hasta el módulo 51: el usuario (roles y permisos) vive en una signal. */
@Service()
export class AuthStore {
  private readonly _usuario = signal<UsuarioSimulado | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly permisos = computed<ReadonlySet<string>>(() => new Set(this._usuario()?.permisos ?? []));
  readonly autenticado = computed(() => this._usuario() !== null);

  iniciarSesion(permisos: string[], roles: string[] = [], nombre = 'Ana'): void {
    this._usuario.set({ nombre, roles, permisos });
  }

  cerrarSesion(): void {
    this._usuario.set(null);
  }

  tienePermiso(permiso: string): boolean {
    return this.permisos().has(permiso); // lee una signal: quien lo llame en un computed reacciona
  }

  tieneRol(rol: string): boolean {
    return this._usuario()?.roles.includes(rol) ?? false;
  }
}
