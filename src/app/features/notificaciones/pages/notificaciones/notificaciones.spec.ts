import { TestBed } from '@angular/core/testing';
import { NotificacionesApiFalsa } from '../../services/notificaciones-api-falsa';
import { Notificaciones } from './notificaciones';

describe('Notificaciones (actualización optimista)', () => {
  async function crear() {
    const fixture = TestBed.createComponent(Notificaciones);
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    const leidas = () => cmp.notificaciones.value().map((n) => n.leida);
    return { fixture, cmp, leidas };
  }

  it('cambia al instante y se queda si el servidor confirma', async () => {
    const { fixture, cmp, leidas } = await crear();
    const promesa = cmp.marcarLeida(cmp.notificaciones.value()[0]);
    expect(leidas()).toEqual([true, false]); // antes de que responda el servidor
    expect(cmp.notificaciones.status()).toBe('local');
    await promesa;
    await fixture.whenStable();
    expect(leidas()).toEqual([true, false]);
  });

  it('si falla, vuelve a la verdad del servidor', async () => {
    const { fixture, cmp, leidas } = await crear();
    TestBed.inject(NotificacionesApiFalsa).fallar = true;
    const promesa = cmp.marcarLeida(cmp.notificaciones.value()[1]);
    expect(leidas()).toEqual([false, true]);
    await promesa;
    expect(cmp.notificaciones.status()).toBe('reloading'); // conserva el valor mientras recarga
    await fixture.whenStable();
    expect(leidas()).toEqual([false, false]);
  });
});
