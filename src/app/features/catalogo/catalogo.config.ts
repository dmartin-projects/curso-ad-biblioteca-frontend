import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface ConfigCatalogo {
  tamanoPagina: number;
  claveFiltros: string;
}

const CONFIG_POR_DEFECTO: ConfigCatalogo = { tamanoPagina: 20, claveFiltros: 'catalogo.filtros' };

/** Con factory: funciona aunque nadie llame a provideCatalogo(). */
export const CONFIG_CATALOGO = new InjectionToken<ConfigCatalogo>('CONFIG_CATALOGO', {
  providedIn: 'root',
  factory: () => CONFIG_POR_DEFECTO,
});

export function provideCatalogo(config: Partial<ConfigCatalogo> = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CONFIG_CATALOGO, useValue: { ...CONFIG_POR_DEFECTO, ...config } },
  ]);
}
