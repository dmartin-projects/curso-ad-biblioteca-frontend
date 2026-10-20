import { test as base, expect, Page } from '@playwright/test';

export const BIBLIO = { email: 'biblio@example.com', password: 'clave-segura-123' };

/** Entra por la pantalla de login, como un usuario. */
export async function entrar(page: Page, usuario = BIBLIO): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(usuario.email);
  await page.getByLabel('Contraseña').fill(usuario.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo', level: 1 })).toBeVisible();
}

/** Fixture: cualquier test que pida `conSesion` recibe una página ya dentro de la app. */
export const test = base.extend<{ conSesion: Page }>({
  conSesion: async ({ page }, use) => {
    await entrar(page);
    await use(page);
  },
});
export { expect };
