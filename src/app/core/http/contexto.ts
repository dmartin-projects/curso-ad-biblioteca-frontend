import { HttpContextToken } from '@angular/common/http';

/** La petición no lleva token ni intenta refrescar (login, refresh, logout). */
export const SIN_AUTH = new HttpContextToken<boolean>(() => false);
/** La pantalla gestiona el error ella misma: sin aviso global. */
export const SIN_AVISO_ERROR = new HttpContextToken<boolean>(() => false);
