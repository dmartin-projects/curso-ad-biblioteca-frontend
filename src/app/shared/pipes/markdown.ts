import { Pipe, PipeTransform } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Módulo 60: Markdown → HTML **saneado**. marked convierte, pero NO limpia: un "<img onerror=…>"
 * dentro del Markdown sale tal cual. DOMPurify lo quita, y después [innerHTML] vuelve a sanear
 * (doble capa). Nunca bypassSecurityTrustHtml con esto.
 *
 *   <div [innerHTML]="libro.sinopsis | markdown"></div>
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(texto: string | null | undefined): string {
    if (!texto) return '';
    const html = marked.parse(texto, { async: false, gfm: true, breaks: true });
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }
}
