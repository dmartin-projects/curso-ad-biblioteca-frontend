import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocaleEs } from '../../../../core/locale';
import { Libro } from '../../interfaces/catalogo.models';
import { LibroCard } from './libro-card';

const DUNE: Libro = {
  id: 1,
  titulo: 'Dune',
  isbn: '9780441172719',
  autores: ['Frank Herbert', 'Brian Herbert'],
  publicado: '1965-08-01',
  generos: [],
  ejemplares_disponibles: 2,
};

async function crear(libro: Libro) {
  const fixture = TestBed.createComponent(LibroCard);
  fixture.componentRef.setInput('libro', libro); // input.required: hay que darlo antes de pintar
  await fixture.whenStable();
  return fixture;
}

describe('LibroCard', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [...provideLocaleEs(), provideRouter([])] }),
  );

  it('pinta título, autores y fecha', async () => {
    const el = (await crear(DUNE)).nativeElement as HTMLElement;
    expect(el.querySelector('h3')?.textContent).toBe('Dune');
    expect(el.querySelector('.autores')?.textContent).toBe('Frank Herbert, Brian Herbert');
    expect(el.textContent).toContain('1 de agosto de 1965'); // locale 'es'
  });

  it('emite el id al reservar', async () => {
    const fixture = await crear(DUNE);
    const emitidos: number[] = [];
    fixture.componentInstance.reservar.subscribe((id) => emitidos.push(id));
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(emitidos).toEqual([1]);
  });

  it.each([
    [0, 'Agotado', true],
    [1, '¡Último ejemplar!', false],
    [5, '5 disponibles', false],
  ])('con %i ejemplares: "%s" y agotado=%s', async (n, etiqueta, agotado) => {
    const fixture = await crear({ ...DUNE, ejemplares_disponibles: n });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.etiqueta')?.textContent?.trim()).toBe(etiqueta);
    expect(host.classList.contains('agotado')).toBe(agotado); // clase en el HOST
    expect(host.querySelector('button')!.disabled).toBe(agotado);
    expect(host.getAttribute('role')).toBe('article');
  });

  it('se repinta al cambiar el input (OnPush + signals)', async () => {
    const fixture = await crear(DUNE);
    fixture.componentRef.setInput('libro', { ...DUNE, titulo: 'Dune Mesías' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h3')?.textContent).toBe(
      'Dune Mesías',
    );
  });
});
