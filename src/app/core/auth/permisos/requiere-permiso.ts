import { computed, Directive, inject, input } from '@angular/core';
import { AuthStore } from '../auth-store';

/**
 * Deshabilita (no oculta) lo que el usuario no puede usar. Es UX: la seguridad está en la API.
 * Solo en <button>: `disabled` no hace nada en un <a> (se sigue pudiendo pulsar); un enlace sin
 * permiso se oculta con *appSiPermiso.
 */
@Directive({
  selector: 'button[appRequierePermiso]',
  host: {
    '[attr.disabled]': 'permitido() ? null : ""',
    '[attr.aria-disabled]': '!permitido()',
    '[attr.title]': 'permitido() ? null : "No tienes permiso para esta acción"',
  },
})
export class RequierePermiso {
  readonly permiso = input.required<string>({ alias: 'appRequierePermiso' });
  private readonly auth = inject(AuthStore);
  protected readonly permitido = computed(() => this.auth.tienePermiso(this.permiso()));
}
