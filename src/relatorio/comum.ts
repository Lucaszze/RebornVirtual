// ---------------------------------------------------------------------------
// Peças pequenas de apresentação, usadas por toda folha do relatório.
//
// Nascem aqui porque duas folhas (a de regimes e a da sonda) usam as mesmas
// células e os mesmos parágrafos. A alternativa é cada folha escrever o seu do
// próprio jeito, que é como duas seções da mesma página passam a não se parecer.
// ---------------------------------------------------------------------------

export function celula(texto: string, cabecalho: boolean = false): HTMLTableCellElement {
  const elemento: HTMLTableCellElement = document.createElement(cabecalho ? 'th' : 'td');
  elemento.textContent = texto;
  return elemento;
}

export function paragrafo(texto: string): HTMLParagraphElement {
  const elemento: HTMLParagraphElement = document.createElement('p');
  elemento.textContent = texto;
  return elemento;
}

export function subtitulo(texto: string): HTMLHeadingElement {
  const elemento: HTMLHeadingElement = document.createElement('h3');
  elemento.textContent = texto;
  return elemento;
}
