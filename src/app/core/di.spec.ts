import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { appConfig } from '../app.config';
import { Almacenamiento, AlmacenamientoLocal, AlmacenamientoMemoria } from './almacenamiento';
import { APP_CONFIG } from './config';
import { Preferencias } from './preferencias';

describe('DI', () => {
  it('APP_CONFIG sale del environment (en tests, el de desarrollo)', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(APP_CONFIG).apiUrl).toBe('/api/v1');
    expect(environment.production).toBe(false);
    expect(TestBed.inject(Almacenamiento)).toBeInstanceOf(AlmacenamientoLocal);
  });

  it('Preferencias funciona igual con otra implementación de Almacenamiento', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Almacenamiento, useClass: AlmacenamientoMemoria }],
    });
    const prefs = TestBed.inject(Preferencias);
    expect(prefs.leer('x', { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    prefs.guardar('x', { b: 3 });
    expect(prefs.leer('x', { a: 1, b: 2 })).toEqual({ a: 1, b: 3 });
    TestBed.inject(Almacenamiento).guardar('x', '{roto');
    expect(prefs.leer('x', { a: 1 })).toEqual({ a: 1 });
  });
});
