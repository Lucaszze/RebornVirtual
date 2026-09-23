// ---------------------------------------------------------------------------
// Graus de liberdade e classe do aparelho, inferidos do que foi concedido.
//
// A API XR não expõe um número de graus de liberdade. Não há propriedade a ler,
// e isso não é omissão: o navegador não sabe o que o sensor faz, sabe o que o
// runtime do aparelho aceitou entregar. O que existe para inferir é o conjunto
// de espaços de referência concedidos, e a inferência tem limites que este
// arquivo registra em vez de esconder.
//
// A inferência é conservadora de propósito: um relatório que afirma "seis graus"
// com base em evidência fraca é pior que um que diz "não dá para saber daqui". O
// primeiro será citado; o segundo, verificado.
// ---------------------------------------------------------------------------

/**
 * O que se pode afirmar sobre o rastreamento de posição — três graus (só
 * orientação) contra seis (orientação e posição).
 */
export type GrausDeLiberdade = 'tres' | 'seis' | 'indeterminado';

/**
 * Classe do aparelho deduzida da capacidade declarada, e não do nome que o
 * navegador diz ter. A escolha é deliberada: a cadeia de identificação do
 * navegador é editável, imitada por outros aparelhos e envelhece a cada versão.
 * O que a sessão concede é o que o aparelho faz agora, na mão de quem monta.
 */
export type ClasseDeAparelho =
  | 'sem-api'
  | 'somente-tela'
  | 'visor-sem-posicao'
  | 'visor-com-posicao'
  | 'aparelho-de-mao-com-camera';

export interface LeituraDeEspacos {
  /** Espaços de referência que a sessão de fato entregou quando pedidos. */
  readonly concedidos: readonly string[];
  /** O modo de sessão em que a leitura foi feita. */
  readonly modo: 'immersive-vr' | 'immersive-ar';
  /** Havia alguma fonte de entrada com pose de punho declarada. */
  readonly comPoseDePunho: boolean;
}

/**
 * Regra da inferência, por extenso porque é ela que precisa poder ser
 * contestada:
 *
 * - `local-floor`, `bounded-floor` ou `unbounded` exigem que o aparelho saiba
 *   onde está o chão em relação a quem observa. Um visor que só gira não sustenta
 *   isso, então a concessão é evidência forte de posição rastreada.
 * - `viewer` sozinho é o mínimo que qualquer sessão entrega: a origem acompanha
 *   quem observa, e translação alguma é observável. Evidência forte da ausência.
 * - `local` no meio é ambíguo de verdade, e daí `indeterminado` em vez de aposta.
 */
export function grausDeLiberdade(leitura: LeituraDeEspacos): GrausDeLiberdade {
  const temChao: boolean =
    leitura.concedidos.includes('local-floor') ||
    leitura.concedidos.includes('bounded-floor') ||
    leitura.concedidos.includes('unbounded');
  if (temChao) {
    return 'seis';
  }
  if (leitura.concedidos.length === 1 && leitura.concedidos[0] === 'viewer') {
    return 'tres';
  }
  return 'indeterminado';
}

/**
 * Classifica o aparelho pela combinação de modo de sessão e posição rastreada.
 * `modosSuportados` vem da consulta sem sessão, e por isso esta função responde
 * mesmo quando nenhuma sessão chegou a abrir.
 */
export function classificarAparelho(
  modosSuportados: readonly string[],
  graus: GrausDeLiberdade,
  temApiXr: boolean,
): ClasseDeAparelho {
  if (!temApiXr) {
    return 'sem-api';
  }
  const suportaVr: boolean = modosSuportados.includes('immersive-vr');
  const suportaAr: boolean = modosSuportados.includes('immersive-ar');

  if (!suportaVr && !suportaAr) {
    return 'somente-tela';
  }
  // Aparelho que faz realidade aumentada e não faz sessão imersiva completa é o
  // celular: a câmera vê o mundo, mas ninguém veste a tela no rosto.
  if (suportaAr && !suportaVr) {
    return 'aparelho-de-mao-com-camera';
  }
  return graus === 'tres' ? 'visor-sem-posicao' : 'visor-com-posicao';
}

/** Frase curta e legível para cada classe, usada no relatório. */
export function descreverClasse(classe: ClasseDeAparelho): string {
  switch (classe) {
    case 'sem-api':
      return 'Navegador sem a API XR, ou página fora de contexto seguro. Resta o regime de tela.';
    case 'somente-tela':
      return 'Aparelho que só sustenta o regime de tela — é o caso base, onde a montagem inteira roda.';
    case 'visor-sem-posicao':
      return 'Visor que acompanha a rotação da cabeça e não o deslocamento. A bancada seria montável, mas sem andar em volta.';
    case 'visor-com-posicao':
      return 'Visor que acompanha rotação e deslocamento, com o chão do ambiente como referência — o regime pleno de montagem no visor.';
    case 'aparelho-de-mao-com-camera':
      return 'Aparelho de mão que compõe a bancada sobre a imagem da própria câmera — o regime da mesa real.';
  }
}
