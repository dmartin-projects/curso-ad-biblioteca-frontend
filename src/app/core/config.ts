import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  paginaPorDefecto: number;
}

/** Con factory: sale del environment aunque nadie lo provea (tests incluidos). */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiUrl: environment.apiUrl, wsUrl: environment.wsUrl, paginaPorDefecto: 20 }),
});
