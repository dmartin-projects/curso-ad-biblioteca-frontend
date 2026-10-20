import { DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

let siguienteId = 0;

/** Tooltip accesible: aparece con el ratón Y con el teclado (foco), y lo anuncia aria-describedby. */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'mostrar()',
    '(focusin)': 'mostrar()',
    '(mouseleave)': 'ocultar()',
    '(focusout)': 'ocultar()',
    '(keydown.escape)': 'ocultar()',
    // la burbuja va en position: fixed con la posición del momento: al hacer scroll se quedaría atrás
    '(window:scroll)': 'ocultar()',
  },
})
export class Tooltip {
  readonly texto = input.required<string>({ alias: 'appTooltip' });
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly id = `tooltip-${++siguienteId}`;
  private burbuja: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.ocultar()); // que no quede huérfano en el body
  }

  protected mostrar(): void {
    if (this.burbuja || !this.texto()) return;
    const burbuja = document.createElement('div');
    burbuja.id = this.id;
    burbuja.setAttribute('role', 'tooltip'); // el atributo: burbuja.role no existe en todos los navegadores
    burbuja.className = 'tooltip';
    burbuja.textContent = this.texto(); // textContent: nunca HTML del usuario
    const caja = this.el.nativeElement.getBoundingClientRect();
    burbuja.style.cssText = `position:fixed;top:${caja.bottom + 4}px;left:${caja.left}px`;
    document.body.appendChild(burbuja);
    this.el.nativeElement.setAttribute('aria-describedby', this.id);
    this.burbuja = burbuja;
  }

  protected ocultar(): void {
    this.burbuja?.remove();
    this.burbuja = null;
    this.el.nativeElement.removeAttribute('aria-describedby');
  }
}
