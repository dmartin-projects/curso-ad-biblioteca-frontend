import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CatalogoPage } from './features/catalogo/pages/catalogo-page/catalogo-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CatalogoPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
