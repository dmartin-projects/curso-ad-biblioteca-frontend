import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/** Emite cuando el elemento (un "centinela" al final de una lista) se acerca a la pantalla. */
@Directive({ selector: '[appAlVerse]' })
export class AlVerse {
  readonly appAlVerse = output<void>();
  /**
   * Cámbiala cada vez que lleguen datos (por ejemplo, el número de elementos). Si tras cargar una
   * página el centinela SIGUE visible (la página no llena la pantalla), el IntersectionObserver no
   * vuelve a avisar —solo avisa de CAMBIOS—: volver a observarlo fuerza una comprobación.
   */
  readonly appAlVerseClave = input<unknown>();
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    const destroyRef = inject(DestroyRef); // inject() aquí, en el constructor (no en el callback)
    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        ([e]) => e.isIntersecting && this.appAlVerse.emit(),
        { rootMargin: '300px' },
      );
      this.observer.observe(this.el.nativeElement);
      destroyRef.onDestroy(() => this.observer?.disconnect());
    });
    afterRenderEffect(() => {
      this.appAlVerseClave(); // dependencia
      if (!this.observer) return;
      this.observer.unobserve(this.el.nativeElement);
      this.observer.observe(this.el.nativeElement); // observar de nuevo = un aviso con el estado actual
    });
  }
}
