import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../../../../core/auth/auth.interceptor';
import { iniciarSesionDePrueba } from '../../../../testing/sesion';
import { relativa } from '../../../../core/prestamos/prestamos-api';
import HistorialPrestamos from './historial-prestamos';

describe('HistorialPrestamos (cursor + virtual scroll)', () => {
  it('relativa(): la URL "next" de DRF, sin el origen', () => {
    expect(relativa('http://localhost:4200/api/v1/prestamos/?cursor=bz0yMA%3D%3D')).toBe(
      '/api/v1/prestamos/?cursor=bz0yMA%3D%3D',
    );
    expect(relativa(null)).toBeNull();
  });

  it('pide la siguiente página con el token (URL relativa → pasa por el interceptor)', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    iniciarSesionDePrueba();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(HistorialPrestamos);
    const primera = http.expectOne('/api/v1/prestamos/');
    expect(primera.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    primera.flush({
      next: 'http://localhost:4200/api/v1/prestamos/?cursor=abc',
      previous: null,
      results: [],
    });
    await fixture.whenStable();
    // con 0 elementos ya estamos "a menos de 20 del final": pide la siguiente
    (fixture.componentInstance as unknown as { alDesplazar(): void }).alDesplazar();
    const segunda = http.expectOne('/api/v1/prestamos/?cursor=abc');
    expect(segunda.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
  });
});
