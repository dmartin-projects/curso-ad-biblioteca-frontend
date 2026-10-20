import { TestBed } from '@angular/core/testing';
import { CatalogoPage } from './catalogo-page';

describe('CatalogoPage', () => {
  it('pinta una tarjeta por libro y el contador con @let', async () => {
    const fixture = TestBed.createComponent(CatalogoPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-libro-card').length).toBe(3);
    expect(el.querySelector('.contador')?.textContent).toContain(
      '3 libros · 3 ejemplares disponibles',
    );
  });

  it('muestra @empty sin libros y avisa al reservar', async () => {
    const fixture = TestBed.createComponent(CatalogoPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('app-libro-card button')!.click(); // Dune
    await fixture.whenStable();
    expect(el.querySelector('.aviso')?.textContent).toContain('libro 1');

    // acceso a un miembro protected solo para preparar el escenario
    (fixture.componentInstance as unknown as { libros: { set(v: unknown[]): void } }).libros.set(
      [],
    );
    await fixture.whenStable();
    expect(el.textContent).toContain('No hay libros que coincidan.');
  });
});
