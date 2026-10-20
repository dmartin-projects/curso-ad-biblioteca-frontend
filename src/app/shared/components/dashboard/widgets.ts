import { WidgetAviso } from './widget-aviso/widget-aviso';
import { WidgetLista } from './widget-lista/widget-lista';
import { WidgetTotal } from './widget-total/widget-total';

/** Registro de widgets: el tipo de la configuración → el component que lo pinta. */
export const WIDGETS = {
  total: WidgetTotal,
  lista: WidgetLista,
  aviso: WidgetAviso,
} as const;

export type TipoWidget = keyof typeof WIDGETS;

export interface ConfigWidget {
  id: number;
  tipo: TipoWidget;
  config: unknown;
}
