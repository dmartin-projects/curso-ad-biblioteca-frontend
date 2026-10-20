import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, Provider } from '@angular/core';

/** Español + euros + dd/MM/yyyy. Función para reutilizarla en app.config y en los tests. */
export function provideLocaleEs(): Provider[] {
  registerLocaleData(localeEs);
  return [
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: 'dd/MM/yyyy' } },
  ];
}
