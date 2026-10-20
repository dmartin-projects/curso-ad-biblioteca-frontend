import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { cambiosSinGuardarGuard } from '../../../../core/auth/guards';
import { erroresInterceptor } from '../../../../core/http/errores';
import { Confirmaciones } from '../../../../shared/components/confirmar/confirmaciones';
import { hastaQue, responder } from '../../../../testing/responder';
import FormularioLibro from './formulario-libro';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DUNE = {
  id: 7,
  titulo: 'Dune',
  isbn: '9780441172719',
  publicado: '1965-08-01',
  paginas: 412,
  sinopsis: '',
  autores: [{ id: 1, nombre: 'Frank', apellidos: 'Herbert', slug: 'frank-herbert' }],
};

describe('FormularioLibro (Signal Forms)', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  /** El guard pregunta a Confirmaciones (un diálogo): en el test, una respuesta preparada. */
  const preguntar = vi.fn<Confirmaciones['preguntar']>();
  afterEach(() => preguntar.mockReset());
  const el = () => harness.routeNativeElement!;
  const campo = (n: string) => el().querySelector<HTMLInputElement>(`[name="libro.${n}"]`)!;
  const escribir = (n: string, v: string) => {
    campo(n).value = v;
    campo(n).dispatchEvent(new Event('input'));
    campo(n).dispatchEvent(new Event('blur'));
  };
  const errores = () => [...el().querySelectorAll('.error')].map((e) => e.textContent?.trim());

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'nuevo', component: FormularioLibro, canDeactivate: [cambiosSinGuardarGuard] },
            {
              path: 'libros/:id/editar',
              component: FormularioLibro,
              canDeactivate: [cambiosSinGuardarGuard],
            },
            { path: 'catalogo/libros/:id', children: [] },
            { path: 'otra', children: [] },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
        { provide: Confirmaciones, useValue: { preguntar } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  it('los <input> reciben name="libro.<campo>" del propio formulario', async () => {
    await harness.navigateByUrl('/nuevo');
    expect(campo('titulo')).not.toBeNull();
    expect(campo('isbn').getAttribute('name')).toBe('libro.isbn');
  });

  it('enviar vacío: no llama a la API y muestra los errores de todos los campos', async () => {
    await harness.navigateByUrl('/nuevo');
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await harness.fixture.whenStable();
    // minLength y pattern NO se quejan de un valor vacío: eso es cosa de required
    expect(errores()).toEqual([
      'El título es obligatorio',
      'El ISBN es obligatorio',
      'Indica al menos un autor',
    ]);
    http.expectNone(() => true);
    // accesible: el campo dice que está mal y por qué, y el foco va al primero que falla
    expect(campo('titulo').getAttribute('aria-invalid')).toBe('true');
    const descrito = campo('titulo').getAttribute('aria-describedby')!;
    expect(document.getElementById(descrito)?.textContent?.trim()).toBe('El título es obligatorio');
    expect(document.activeElement).toBe(campo('titulo'));
    expect(campo('paginas').getAttribute('aria-invalid')).toBe('false');
  });

  it('reglas: fecha futura, páginas fuera de rango', async () => {
    await harness.navigateByUrl('/nuevo');
    escribir('publicado', '2999-01-01');
    escribir('paginas', '0');
    await harness.fixture.whenStable();
    expect(errores()).toEqual(['Al menos 1 página', 'La fecha no puede ser futura']);
    escribir('paginas', '6000');
    await harness.fixture.whenStable();
    expect(errores()).toContain('Como mucho 5000 páginas');
  });

  it('ISBN duplicado: validateHttp con debounce (una sola petición)', async () => {
    await harness.navigateByUrl('/nuevo');
    escribir('isbn', '978-0441');
    escribir('isbn', '978-0-441-17271-9');
    await esperar(350); // debounce de 300 ms
    const req = await responder(http, '/api/v1/libros/', {
      count: 1,
      results: [{ id: 3, isbn: '9780441172719', titulo: 'Dune' }],
    });
    expect(req.params.get('search')).toBe('9780441172719');
    await hastaQue(harness.fixture, () => errores().includes('Ya existe un libro con ese ISBN'));
    http.verify(); // y ninguna otra
  });

  it('errores 400 de DRF en su campo; los generales en el formulario', async () => {
    await harness.navigateByUrl('/nuevo');
    const cmp = harness.routeDebugElement!.componentInstance as FormularioLibro;
    // rellenamos el modelo directamente (los autores vienen de un control propio)
    cmp['modelo'].set({
      titulo: 'Dune',
      isbn: '9780441172719',
      paginas: 412,
      publicado: '',
      sinopsis: '',
      autores_ids: [1],
    });
    await esperar(350);
    await responder(http, '/api/v1/libros/', { count: 0, results: [] }); // sin duplicados
    await harness.fixture.whenStable();
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    const post = await responder(
      http,
      '/api/v1/libros/',
      {
        type: 'validacion',
        title: 'Los datos enviados no son válidos.',
        errors: {
          isbn: ['Ya existe un libro con este ISBN.'],
          non_field_errors: ['Revisa los datos.'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(post.method).toBe('POST');
    expect(post.body).toEqual({
      titulo: 'Dune',
      isbn: '9780441172719',
      paginas: 412,
      publicado: null, // '' → null para DRF
      sinopsis: '',
      autores_ids: [1],
    });
    await hastaQue(harness.fixture, () => errores().length > 0);
    expect(errores()).toContain('Ya existe un libro con este ISBN.');
    expect(el().querySelector('[role=alert]')?.textContent).toBe('Revisa los datos.');
  });

  it('edición: carga el libro, envía PATCH y no pregunta al salir tras guardar', async () => {
    const navegacion = harness.navigateByUrl('/libros/7/editar');
    await responder(http, '/api/v1/libros/7/', DUNE);
    // al cargar el ISBN en el modelo se lanza la comprobación de duplicados: es el propio libro
    await responder(http, '/api/v1/libros/', {
      count: 1,
      results: [{ id: 7, isbn: '9780441172719' }],
    });
    await navegacion;
    await hastaQue(harness.fixture, () => campo('titulo').value === 'Dune');
    expect(el().querySelector('app-selector-autores .elegidos')?.textContent).toContain(
      'Frank Herbert',
    );
    expect(errores()).toEqual([]); // su propio ISBN no cuenta como duplicado

    escribir('titulo', 'Dune (ed. revisada)');
    el().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    const patch = await responder(http, '/api/v1/libros/7/', {
      ...DUNE,
      titulo: 'Dune (ed. revisada)',
    });
    expect(patch.method).toBe('PATCH');
    await hastaQue(harness.fixture, () => TestBed.inject(Router).url === '/catalogo/libros/7');
    expect(preguntar).not.toHaveBeenCalled(); // dirty, pero guardado: el guard no pregunta
  });

  it('canDeactivate: con cambios sin guardar pregunta', async () => {
    await harness.navigateByUrl('/nuevo');
    escribir('titulo', 'Algo');
    await harness.fixture.whenStable();
    preguntar.mockResolvedValue(false);
    await harness.navigateByUrl('/otra');
    expect(preguntar).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/nuevo');
  });
});
