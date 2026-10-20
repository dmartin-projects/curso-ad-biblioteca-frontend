import { entrar, expect, test } from './fixtures';

test.describe('login contra el backend real', () => {
  test('contraseña incorrecta: mensaje genérico y seguimos en /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('biblio@example.com');
    await page.getByLabel('Contraseña').fill('no-es-esta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login correcto → catálogo, y ?next= solo lleva a rutas internas', async ({ page }) => {
    await page.goto('/login?next=' + encodeURIComponent('//malicioso.com'));
    await entrar(page); // entrar() comprueba que aterriza en el catálogo
    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  });
});

test.describe('login con la API simulada', () => {
  test('429: el aviso del servidor, sin llegar a Django', async ({ page }) => {
    await page.route('**/api/v1/auth/refresh/', (r) => r.fulfill({ status: 401, json: {} }));
    await page.route('**/api/v1/auth/login/', (r) =>
      r.fulfill({
        status: 429,
        json: { type: 'limite_peticiones', title: 'Demasiadas peticiones. Inténtalo más tarde.' },
      }),
    );
    await page.goto('/login');
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByLabel('Contraseña').fill('lo-que-sea');
    const peticion = page.waitForRequest('**/api/v1/auth/login/');
    await page.getByRole('button', { name: 'Entrar' }).click();
    expect((await peticion).postDataJSON()).toEqual({
      email: 'ana@example.com',
      password: 'lo-que-sea',
    });
    await expect(page.getByRole('alert')).toHaveText('Demasiadas peticiones. Inténtalo más tarde.');
  });
});
