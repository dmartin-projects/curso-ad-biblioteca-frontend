/// <reference lib="webworker" />
import { parsearCsv } from './parsear';

// Sin DOM ni servicios de Angular: recibe el texto, calcula y devuelve el resultado
addEventListener('message', ({ data }: MessageEvent<string>) => {
  postMessage(parsearCsv(data));
});
