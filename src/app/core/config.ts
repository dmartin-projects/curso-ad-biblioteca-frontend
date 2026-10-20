import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  paginaPorDefecto: number;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
