// ---------------------------------------------------------------------------
// O diário da bancada — o que aconteceu, escrito onde se possa ler.
//
// Este é o "Painel de mensagens" da Seção 3, na sua forma de página. O console
// de depuração não existe dentro de um visor: quem está com o aparelho no rosto
// não abre painel de desenvolvedor, não lê aviso de rede e não vê exceção. Tudo
// o que o ambiente tiver a dizer precisa aparecer na própria página, em corpo de
// texto que se leia a um braço de distância.
//
// O espelho no console continua existindo, e não por hábito: quando o aparelho
// está ligado ao computador por depuração remota, o mesmo texto em dois lugares
// é o que permite comparar o que a página mostrou com o que o navegador
// registrou.
// ---------------------------------------------------------------------------

export type Severidade = 'nota' | 'alerta' | 'falha';

export interface Entrada {
  readonly severidade: Severidade;
  readonly texto: string;
}

/**
 * Acumula as entradas e as escreve num elemento da página. O acúmulo permite ao
 * diário existir antes de o elemento existir: a sondagem pode falhar durante o
 * carregamento, e uma mensagem perdida por não ter onde ser escrita é a pior das
 * mensagens.
 */
export class Diario {
  private readonly entradas: Entrada[] = [];
  private destino: HTMLElement | undefined = undefined;

  public fixarDestino(destino: HTMLElement): void {
    this.destino = destino;
    this.redesenhar();
  }

  public nota(texto: string): void {
    this.registrar({ severidade: 'nota', texto });
  }

  public alerta(texto: string): void {
    this.registrar({ severidade: 'alerta', texto });
  }

  public falha(texto: string): void {
    this.registrar({ severidade: 'falha', texto });
  }

  private registrar(entrada: Entrada): void {
    this.entradas.push(entrada);
    console.info(`[bancada:${entrada.severidade}] ${entrada.texto}`);
    this.redesenhar();
  }

  private redesenhar(): void {
    const destino: HTMLElement | undefined = this.destino;
    if (destino === undefined) {
      return;
    }
    destino.replaceChildren();
    // As entradas mais recentes primeiro: numa sessão longa é a última resposta
    // que importa, e rolar até o fim não é gesto que se faça de visor.
    for (const entrada of [...this.entradas].reverse()) {
      const linha: HTMLParagraphElement = document.createElement('p');
      linha.className = `diario diario-${entrada.severidade}`;
      linha.textContent = entrada.texto;
      destino.appendChild(linha);
    }
  }
}

/**
 * Traduz o que veio de um `catch` em texto legível. A recusa de sessão chega
 * como erro, e o erro cru — nome da classe e uma frase em inglês — é exatamente
 * o que faz um grupo concluir que o código quebrou quando o que houve foi o
 * aparelho dizendo não (Seção 11, item 2).
 */
export function explicarFalha(erro: unknown): string {
  if (erro instanceof DOMException && erro.name === 'NotSupportedError') {
    return 'O aparelho recusou a sessão neste modo. Ele não a sustenta, e o pedido foi respondido.';
  }
  if (erro instanceof DOMException && erro.name === 'SecurityError') {
    return 'O navegador recusou o pedido por falta de gesto de quem usa ou por contexto inseguro. O botão precisa ser tocado, e a página precisa estar em conexão cifrada (HTTPS).';
  }
  if (erro instanceof DOMException && erro.name === 'NotAllowedError') {
    return 'A permissão foi negada — no caso da câmera, reautorize nas permissões do navegador e tente de novo. A cena continua disponível no regime de tela.';
  }
  if (erro instanceof DOMException && erro.name === 'InvalidStateError') {
    return 'Já existe uma sessão aberta neste navegador. Encerre a anterior antes de tentar de novo.';
  }
  if (erro instanceof Error) {
    return `A operação parou: ${erro.message}`;
  }
  return 'A operação parou por um motivo que o navegador não descreveu.';
}
