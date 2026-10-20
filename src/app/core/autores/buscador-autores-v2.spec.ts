import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AutoresApiFalsa } from './autores-api-falsa';
import { BuscadorAutoresHttp } from './buscador-autores-http/buscador-autores-http';
import { BuscadorAutoresSignal } from './buscador-autores-signal/buscador-autores-signal';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escribir(el: HTMLElement, texto: string) {
  const input = el.querySelector('input')!;
  input.value = texto;
  input.dispatchEvent(new Event('input'));
}

describe('Buscador de autores con signals', () => {
  it('A: toObservable + debounceTime + switchMap + toSignal', async () => {
    const fixture = TestBed.createComponent(BuscadorAutoresSignal);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    escribir(el, 'i');
    escribir(el, 'isa');
    await esperar(550);
    await fixture.whenStable();
    expect([...el.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Isaac Asimov',
      'Isabel Allende',
    ]);
    expect(TestBed.inject(AutoresApiFalsa).llamadas).toBe(1);
  });

  it('B: debounced + httpResource (una sola petición tras dejar de escribir)', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BuscadorAutoresHttp);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    escribir(el, 'g');
    escribir(el, 'ga');
    escribir(el, 'garcia');
    await esperar(100);
    fixture.detectChanges();
    http.expectNone(() => true); // todavía dentro de los 300 ms
    await esperar(300);
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url === '/api/v1/autores/');
    expect(req.request.params.get('search')).toBe('garcia');
    req.flush({
      count: 1,
      results: [{ id: 2, nombre: 'Gabriel', apellidos: 'García Márquez', slug: 'gabo' }],
    });
    await fixture.whenStable();
    expect(el.querySelector('li')?.textContent?.trim()).toBe('Gabriel García Márquez');
    http.verify();
  });
});
