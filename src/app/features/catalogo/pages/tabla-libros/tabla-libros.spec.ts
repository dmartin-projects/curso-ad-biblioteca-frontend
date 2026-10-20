import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginadorEnEspanol } from '../../../../core/paginador-es';
import { hastaQue, responder } from '../../../../testing/responder';
import { LIBROS_DE_PRUEBA } from '../../services/datos-prueba';
import TablaLibros from './tabla-libros';

const pagina = {
  count: 45,
  total_pages: 3,
  page: 1,
  page_size: 20,
  next: null,
  previous: null,
  results: LIBROS_DE_PRUEBA,
};

describe('TablaLibros (MatTable, orden y paginación en el servidor, estado en la URL)', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'tabla', component: TablaLibros }], withComponentInputBinding()),
        provideHttpClientTesting(),
        { provide: MatPaginatorIntl, useClass: PaginadorEnEspanol },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  async function abrir(url: string) {
    const nav = harness.navigateByUrl(url);
    const req = await responder(http, '/api/v1/libros/', pagina);
    await nav;
    await harness.fixture.whenStable();
    return req;
  }

  it('pinta las filas y pide orden por título por defecto', async () => {
    const req = await abrir('/tabla');
    expect(req.params.toString()).toBe('page=1&page_size=20&ordering=titulo');
    const el = harness.routeNativeElement!;
    expect(el.querySelectorAll('tr.mat-mdc-row')).toHaveLength(5);
    expect(el.querySelector('.mat-mdc-paginator-range-label')?.textContent?.trim()).toBe(
      '1 – 20 de 45',
    );
  });

  it('clic en "Publicado" → ?ordering=publicado (y otra vez → -publicado)', async () => {
    await abrir('/tabla?page=2');
    const cabecera = () =>
      [...harness.routeNativeElement!.querySelectorAll<HTMLElement>('th')].find((t) =>
        t.textContent?.includes('Publicado'),
      )!;
    cabecera().querySelector<HTMLElement>('.mat-sort-header-container')!.click();
    const req = await responder(http, '/api/v1/libros/', pagina);
    expect(TestBed.inject(Router).url).toBe('/tabla?ordering=publicado'); // y vuelta a la página 1
    expect(req.params.get('ordering')).toBe('publicado');
    await harness.fixture.whenStable();
    cabecera().querySelector<HTMLElement>('.mat-sort-header-container')!.click();
    await responder(http, '/api/v1/libros/', pagina);
    await hastaQue(
      harness.fixture,
      () => TestBed.inject(Router).url === '/tabla?ordering=-publicado',
    );
  });

  it('el paginador empieza en 0 y DRF en 1', async () => {
    await abrir('/tabla?ordering=-publicado');
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')!
      .click();
    const req = await responder(http, '/api/v1/libros/', pagina);
    expect(req.params.get('page')).toBe('2');
    expect(TestBed.inject(Router).url).toBe('/tabla?ordering=-publicado&page=2&page_size=20');
  });
});
