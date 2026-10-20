import { TestBed } from '@angular/core/testing';
import { Usuario } from '../core/api/tipos';
import { AuthStore } from '../core/auth/auth-store';

export const USUARIO_DE_PRUEBA: Usuario = {
  id: 1,
  email: 'ana@example.com',
  nombre: 'Ana',
  apellidos: '',
  fecha_alta: '2026-01-01T00:00:00Z',
  es_personal: false,
  permisos: [],
};

/** Sesión iniciada sin pasar por la API (para tests de componentes y rutas). */
export function iniciarSesionDePrueba(permisos: string[] = [], esPersonal = false): void {
  TestBed.inject(AuthStore).establecerSesion('token-de-prueba', {
    ...USUARIO_DE_PRUEBA,
    permisos,
    es_personal: esPersonal,
  });
}
