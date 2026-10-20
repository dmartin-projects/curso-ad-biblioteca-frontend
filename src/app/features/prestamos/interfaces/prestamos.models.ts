export interface PrestamoResumen {
  id: number;
  libro: { id: number; titulo: string };
  fecha_limite: string;
  estado: 'activo' | 'devuelto';
}
