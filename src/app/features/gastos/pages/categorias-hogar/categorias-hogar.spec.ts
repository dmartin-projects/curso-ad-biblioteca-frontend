import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoriasHogar } from './categorias-hogar';

describe('CategoriasHogar (chain)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  it('no pide las categorías hasta tener el hogar; luego sí', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CategoriasHogar);
    fixture.componentRef.setInput('hogarId', 7);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const hogar = http.expectOne('/api/v1/hogares/7/');
    http.expectNone('/api/v1/hogares/7/categorias/');
    expect(el.querySelector('.estado')?.textContent).toBe('loading / loading'); // estado propagado

    hogar.flush({ id: 7, nombre: 'Casa' });
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
    http.expectOne('/api/v1/hogares/7/categorias/').flush([{ id: 1, nombre: 'Súper' }]);
    await fixture.whenStable();
    expect(el.querySelector('h3')?.textContent).toBe('Casa');
    expect(el.querySelector('li')?.textContent).toBe('Súper');
    expect(el.querySelector('.estado')?.textContent).toBe('resolved / resolved');
    http.verify();
  });

  it('si el hogar falla, las categorías quedan en error sin hacer petición', async () => {
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CategoriasHogar);
    fixture.componentRef.setInput('hogarId', 8);
    fixture.detectChanges();
    http.expectOne('/api/v1/hogares/8/').flush('no', { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(fixture.componentInstance.categorias.status()).toBe('error');
    http.verify(); // ninguna petición de categorías
  });
});
