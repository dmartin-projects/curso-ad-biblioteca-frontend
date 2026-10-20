import { expect, test } from './fixtures';

test('crear un gasto: errores accesibles, y el aviso al guardar', async ({ conSesion: page }) => {
  await page.goto('/gastos/nuevo'); // la sesión sigue: el access token está en memoria, pero el
  // refresh por cookie la recupera al cargar la página (módulo 51)
  await expect(page.getByRole('heading', { name: 'Nuevo gasto' })).toBeVisible();

  // enviar vacío: el foco va al primer campo con error, y el error está enlazado
  await page.getByRole('button', { name: 'Guardar' }).click();
  const comercio = page.getByLabel('Comercio');
  await expect(comercio).toBeFocused();
  await expect(comercio).toHaveAttribute('aria-invalid', 'true');
  await expect(comercio).toHaveAccessibleDescription('El comercio es obligatorio');

  await comercio.fill('Mercadona');
  await page.getByRole('radio', { name: 'Súper' }).check();
  const linea = page.getByRole('group', { name: 'Línea 1' });
  await linea.getByLabel('Descripción').fill('Pan');
  await linea.getByLabel('Cantidad').fill('2');
  await linea.getByLabel('Precio').fill('1.35');
  await expect(page.getByText(/^Total:/)).toHaveText('Total: 2,70 €');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status').getByText('Gasto de 2,70 € guardado')).toBeVisible();
});
