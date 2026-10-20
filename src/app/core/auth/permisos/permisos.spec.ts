import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { iniciarSesionDePrueba } from '../../../testing/sesion';
import { RequierePermiso } from './requiere-permiso';
import { SiPermiso } from './si-permiso';

@Component({
  imports: [SiPermiso, RequierePermiso],
  template: `
    <button id="borrar" *appSiPermiso="'catalogo.delete_libro'; else sinPermiso">Borrar</button>
    <ng-template #sinPermiso><small id="aviso">Sin permiso</small></ng-template>
    <button id="nuevo" appRequierePermiso="catalogo.add_libro">Nuevo</button>
  `,
})
class ConPermisos {}

describe('Directivas de permisos', () => {
  it('SiPermiso y RequierePermiso reaccionan al AuthStore', async () => {
    const fixture = TestBed.createComponent(ConPermisos);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#borrar')).toBeNull();
    expect(el.querySelector('#aviso')).not.toBeNull();
    expect(el.querySelector<HTMLButtonElement>('#nuevo')!.disabled).toBe(true);

    iniciarSesionDePrueba(['catalogo.delete_libro', 'catalogo.add_libro']);
    await fixture.whenStable();
    expect(el.querySelector('#borrar')).not.toBeNull();
    expect(el.querySelector('#aviso')).toBeNull();
    const nuevo = el.querySelector<HTMLButtonElement>('#nuevo')!;
    expect(nuevo.disabled).toBe(false);
    expect(nuevo.getAttribute('aria-disabled')).toBe('false');
  });
});
