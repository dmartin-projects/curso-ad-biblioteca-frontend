import { Page } from '@playwright/test';
import { entrar, expect, test } from './fixtures';

/** Simula que el access de la pestaña ha caducado: un token que la API rechaza con 401. */
async function caducarAccess(page: Page): Promise<void> {
  await page.evaluate(() => {
    const ng = (window as unknown as { ng: { getComponent: (e: Element | null) => unknown } }).ng;
    const layout = ng.getComponent(document.querySelector('app-layout-privado')) as {
      auth: { establecerSesion: (a: string, u: unknown) => void; usuario: () => unknown };
    };
    layout.auth.establecerSesion('caducado', layout.auth.usuario());
  });
}

// Un solo login para todo (el de la API admite 5 por minuto, módulo 36)
test('dos pestañas (comparten la cookie): refrescan en fila, y "Salir" en una cierra las dos', async ({
  context,
  page,
}) => {
  await entrar(page);
  const otra = await context.newPage();
  await otra.goto('/catalogo'); // restaura la sesión con la cookie que dejó el login
  await expect(otra.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible();

  // cada refresh tarda 500 ms más de lo normal: si no fueran en fila, se solaparían
  const refrescos: { inicio: number; fin: number; status: number }[] = [];
  await context.route('**/api/v1/auth/refresh/', async (route) => {
    const inicio = Date.now();
    const respuesta = await route.fetch();
    await new Promise((r) => setTimeout(r, 500));
    await route.fulfill({ response: respuesta });
    refrescos.push({ inicio, fin: Date.now(), status: respuesta.status() });
  });

  // las dos con el access caducado piden a la vez la página 2: 401 → refresh en cada una
  await caducarAccess(page);
  await caducarAccess(otra);
  await Promise.all([page, otra].map((p) => p.getByRole('button', { name: 'Siguiente' }).click()));

  await expect.poll(() => refrescos.length).toBe(2);
  for (const p of [page, otra]) {
    await expect(p).toHaveURL(/\/catalogo\?page=2$/);
    await expect(p.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible();
  }
  expect(refrescos.map((r) => r.status)).toEqual([200, 200]);
  const [primero, segundo] = refrescos.sort((a, b) => a.inicio - b.inicio);
  expect(segundo.inicio).toBeGreaterThanOrEqual(primero.fin - 50); // en fila, no a la vez

  // "Salir" en una: la otra también va al login, sin recargar (BroadcastChannel)
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(otra).toHaveURL(/\/login/);
});
