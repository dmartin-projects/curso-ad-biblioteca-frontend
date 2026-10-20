import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStore } from '../auth-store';

/** *appSiPermiso="'perm'; else otra": crea el contenido solo con el permiso. */
@Directive({ selector: '[appSiPermiso]' })
export class SiPermiso {
  readonly permiso = input.required<string>({ alias: 'appSiPermiso' });
  // eslint-disable-next-line @angular-eslint/no-input-rename -- el "else" de la microsyntax
  readonly sino = input<TemplateRef<unknown> | null>(null, { alias: 'appSiPermisoElse' });

  private readonly plantilla = inject(TemplateRef);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthStore);

  constructor() {
    // effect bien usado: sincroniza el DOM con el estado
    effect(() => {
      const permitido = this.auth.tienePermiso(this.permiso());
      const sino = this.sino();
      this.vcr.clear();
      if (permitido) {
        this.vcr.createEmbeddedView(this.plantilla);
      } else if (sino) {
        this.vcr.createEmbeddedView(sino);
      }
    });
  }
}
