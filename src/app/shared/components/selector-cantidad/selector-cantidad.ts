import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-selector-cantidad',
  templateUrl: './selector-cantidad.html',
})
export class SelectorCantidad {
  readonly valor = model(1); // input "valor" + output "valorChange" → [(valor)]
  readonly min = input(0);
  readonly max = input(Infinity);
}
