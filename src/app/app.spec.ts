import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { Almacenamiento, AlmacenamientoMemoria } from './core/almacenamiento';

describe('App', () => {
  it('pinta el título y, en /catalogo, el catálogo (cargado bajo demanda)', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: Almacenamiento, useClass: AlmacenamientoMemoria },
      ],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Biblioteca');
    expect(TestBed.inject(Router).url).toBe('/catalogo');
    // la ruta aporta provideCatalogo({ tamanoPagina: 2 })
    expect(el.querySelectorAll('app-libro-card').length).toBe(2);
  });
});
