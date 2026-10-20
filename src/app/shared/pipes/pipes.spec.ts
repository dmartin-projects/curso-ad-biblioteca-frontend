import { TestBed } from '@angular/core/testing';
import { DemoFiltrar } from '../../labs/demo-filtrar/demo-filtrar';
import { IbanPipe } from './iban';
import { TamanoArchivoPipe } from './tamano-archivo';
import { TiempoRelativoPipe } from './tiempo-relativo';

describe('pipes propios', () => {
  const ahora = Date.parse('2026-10-19T12:00:00Z');

  it('tiempoRelativo', () => {
    const p = new TiempoRelativoPipe();
    expect(p.transform('2026-10-16T12:00:00Z', ahora)).toBe('hace 3 días');
    expect(p.transform('2026-10-19T14:00:00Z', ahora)).toBe('dentro de 2 horas');
    expect(p.transform('2026-10-20T12:00:00Z', ahora)).toBe('mañana');
    expect(p.transform(null, ahora)).toBe('');
  });

  it('tamanoArchivo', () => {
    const p = new TamanoArchivoPipe();
    expect(p.transform(512)).toBe('512 B');
    expect(p.transform(1536)).toBe('1,5 KB');
    expect(p.transform(5 * 1024 * 1024)).toBe('5 MB');
    expect(p.transform(undefined)).toBe('');
  });

  it('iban', () => {
    const p = new IbanPipe();
    expect(p.transform('ES91 2100 0418 4502 0005 1332')).toBe('ES91 •••• •••• •••• •••• 1332');
    expect(p.transform('es9121000418450200051332', false)).toBe('ES91 2100 0418 4502 0005 1332');
    expect(p.transform('')).toBe('');
  });

  it('filtrarPor puro: mutar no actualiza, update sí', async () => {
    const fixture = TestBed.createComponent(DemoFiltrar);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const ids = (sel: string) => [...el.querySelectorAll(`${sel} li`)].map((li) => li.textContent);
    expect(ids('.pipe')).toEqual(['1']);

    fixture.componentInstance.anadirMutando({ id: 3, categoria: 'super' });
    fixture.componentRef.changeDetectorRef.markForCheck(); // forzamos una revisión
    await fixture.whenStable();
    expect(ids('.pipe')).toEqual(['1']); // ❌ el 3 no aparece
    expect(ids('.computed')).toEqual(['1']);

    fixture.componentInstance.anadirInmutable({ id: 4, categoria: 'super' });
    await fixture.whenStable();
    expect(ids('.pipe')).toEqual(['1', '3', '4']); // ✅ referencia nueva
    expect(ids('.computed')).toEqual(['1', '3', '4']);
  });
});
