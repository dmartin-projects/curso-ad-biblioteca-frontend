import { Component, inject, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown';

const ATAQUE = '<img src=x onerror="alert(1)"><b>hola</b>';

@Component({
  imports: [MarkdownPipe],
  template: `
    <p class="texto">{{ valor() }}</p>
    <div class="html" [innerHTML]="valor()"></div>
    <div class="markdown" [innerHTML]="valor() | markdown"></div>
    <div class="bypass" [innerHTML]="peligroso()"></div>
    <a class="enlace" [href]="enlace()">ir</a>
  `,
})
class Prueba {
  readonly valor = input('');
  readonly enlace = input('');
  private readonly sanitizer = inject(DomSanitizer);
  // ❌ solo para el test: así se desactiva la protección
  protected peligroso = () => this.sanitizer.bypassSecurityTrustHtml(this.valor());
}

async function pintar(valor: string, enlace = '/') {
  const fixture = TestBed.createComponent(Prueba);
  fixture.componentRef.setInput('valor', valor);
  fixture.componentRef.setInput('enlace', enlace);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Módulo 60: XSS', () => {
  it('{{ }} escapa: el ataque se ve como texto', async () => {
    const el = await pintar(ATAQUE);
    expect(el.querySelector('.texto')!.textContent).toBe(ATAQUE);
    expect(el.querySelector('.texto img')).toBeNull();
  });

  it('[innerHTML] sanea: quita onerror, deja <b> y avisa en consola', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await pintar(ATAQUE);
    expect(el.querySelector('.html')!.innerHTML).toBe('<img src="x"><b>hola</b>');
    expect(aviso.mock.calls.flat().join(' ')).toContain('sanitizing HTML stripped some content');
  });

  it('bypassSecurityTrustHtml deja pasar el onerror (por eso no se usa con datos ajenos)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await pintar(ATAQUE);
    expect(el.querySelector('.bypass img')!.getAttribute('onerror')).toBe('alert(1)');
  });

  it('[href] con javascript: queda neutralizado', async () => {
    const el = await pintar('', 'javascript:alert(1)');
    expect(el.querySelector('.enlace')!.getAttribute('href')).toBe('unsafe:javascript:alert(1)');
  });

  it('Markdown saneado: formato sí, scripts no', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const md =
      '**Dune** es _ciencia ficción_.\n\n- uno\n- dos\n\n[web](https://dune.example) y [truco](javascript:alert(1))' +
      '\n\n<script>alert(1)</script><img src=x onerror=alert(1)>';
    const el = await pintar(md);
    const html = el.querySelector('.markdown')!.innerHTML;
    expect(html).toContain('<strong>Dune</strong>');
    expect(html).toContain('<li>uno</li>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).toContain('<a href="https://dune.example">web</a>');
    expect(html).not.toContain('href="javascript:'); // marked lo deja como enlace; DOMPurify quita el href
  });
});
