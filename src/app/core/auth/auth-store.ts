import { computed, Service, signal } from '@angular/core';

/** Simulado hasta el módulo 51: guarda los permisos del usuario en una signal. */
@Service()
export class AuthStore {
  private readonly _permisos = signal<ReadonlySet<string>>(new Set());
  readonly permisos = this._permisos.asReadonly();
  readonly autenticado = computed(() => this._permisos().size > 0);

  iniciarSesion(permisos: string[]): void {
    this._permisos.set(new Set(permisos));
  }

  cerrarSesion(): void {
    this._permisos.set(new Set());
  }

  tienePermiso(permiso: string): boolean {
    return this._permisos().has(permiso); // lee una signal: quien lo llame en un computed reacciona
  }
}
