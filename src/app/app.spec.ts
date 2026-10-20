import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('pinta el título y el catálogo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Biblioteca');
    expect(el.querySelector('app-catalogo-page')).not.toBeNull();
  });
});
