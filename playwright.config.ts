import { defineConfig, devices } from '@playwright/test';

/**
 * Módulo 62: E2E contra la app de verdad. Necesita el backend (Django en :8000, como en el módulo 51);
 * el frontend lo arranca Playwright (o reutiliza el ng serve que ya tengas abierto).
 */
export default defineConfig({
  testDir: 'e2e',
  // el login de la API admite 5 intentos por minuto (módulo 36): en serie, y pocos logins
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // si los navegadores de Playwright no se pueden descargar (CI cerrada), uno ya instalado
        launchOptions: { executablePath: process.env['CHROME_PATH'] || undefined },
      },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
