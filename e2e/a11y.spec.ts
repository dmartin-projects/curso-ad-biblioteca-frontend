import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21aa'];
const violaciones = (r: Awaited<ReturnType<AxeBuilder['analyze']>>) =>
  r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);

test('login sin errores de accesibilidad (WCAG 2.1 AA)', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  expect(violaciones(await new AxeBuilder({ page }).withTags(REGLAS).analyze())).toEqual([]);
});

test('catálogo y formulario de gasto sin errores (claro y oscuro)', async ({ conSesion: page }) => {
  for (const tema of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: tema });
    for (const ruta of ['/catalogo', '/gastos/nuevo']) {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const r = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
      expect(violaciones(r), `${ruta} (${tema})`).toEqual([]);
    }
  }
});
