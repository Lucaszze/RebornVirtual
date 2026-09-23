// ---------------------------------------------------------------------------
// Declaração dos três regimes da montagem (Seção 9 da especificação).
//
// Este arquivo não abre sessão, não renderiza e não detecta nada: declara,
// regime a regime, o espaço de referência pretendido, o que será rastreado e
// contra o que a bancada será registrada. Escrever a intenção antes do código
// tem uma consequência barata e boa — mais adiante, quando os regimes existirem
// de fato, a declaração pode ser confrontada com o comportamento observado
// (é o que faz verificacao.ts e, em sessão, a sonda).
// ---------------------------------------------------------------------------

/**
 * Os três regimes do ambiente. Os dois últimos nomes coincidem com os modos de
 * sessão da API XR do navegador de propósito — é o que permite perguntar ao
 * aparelho, sem tradução no meio, se ele suporta o que declaramos.
 */
export type RegimeId = 'inline' | 'immersive-vr' | 'immersive-ar';

/**
 * O que o regime faz com o ambiente de quem observa — a distinção que separa os
 * três antes de qualquer detalhe técnico.
 */
export type TratamentoDoMundo =
  | 'substitui'   // o ambiente sintético toma o lugar do ambiente real (visor)
  | 'preserva'    // o ambiente real permanece visível e recebe a bancada sobre si (câmera)
  | 'exibe';      // a cena é mostrada por uma janela, sem tocar o real (tela)

/**
 * Modo de composição do fundo, tal como a API XR o nomeia. Fundo opaco esconde
 * o mundo; os outros dois o deixam passar. Só é legível com uma sessão ativa, e
 * por isso aqui ele é o valor ESPERADO — a leitura do valor real chega quando
 * houver sessão (e a sonda confronta os dois).
 */
export type ModoDeComposicao = 'opaque' | 'additive' | 'alpha-blend';

export interface Regime {
  readonly id: RegimeId;
  /** Como a especificação o chama, na fala do grupo. */
  readonly nome: string;
  readonly tratamentoDoMundo: TratamentoDoMundo;
  /** Espaço de referência pretendido, no vocabulário da API XR. */
  readonly espacoDeReferencia: 'viewer' | 'local' | 'local-floor' | 'unbounded';
  /** O que o sistema rastreia neste regime, em uma frase. */
  readonly rastreia: string;
  /** Contra o que a bancada é registrada — a origem do mundo virtual. */
  readonly registroContra: string;
  readonly composicaoEsperada: ModoDeComposicao;
  /** Por que este regime existe no projeto, e não como enfeite comparativo. */
  readonly papel: string;
}

export const REGIMES: readonly Regime[] = [
  {
    id: 'inline',
    nome: 'Na tela',
    tratamentoDoMundo: 'exibe',
    espacoDeReferencia: 'viewer',
    rastreia: 'nada do corpo; a câmera orbita a bancada obedecendo ao mouse',
    registroContra: 'a origem da própria cena, a bancada fixada por quem a modelou',
    composicaoEsperada: 'opaque',
    papel:
      'É o caso base e o destino de quem não tem visor: a montagem inteira precisa ' +
      'rodar aqui, e é nela que as regras nascem e são testadas (Blocos 3 e 4).',
  },
  {
    id: 'immersive-vr',
    nome: 'No visor',
    tratamentoDoMundo: 'substitui',
    espacoDeReferencia: 'local-floor',
    rastreia: 'a pose da cabeça e a das duas mãos, com seis graus de liberdade; o pulso gira a peça',
    registroContra:
      'o chão do espaço físico onde a pessoa está, o que faz a bancada nascer à ' +
      'altura de 0,95 m em vez de flutuar',
    composicaoEsperada: 'opaque',
    papel:
      'É onde profundidade real e giro de pulso passam a existir: dá para contornar ' +
      'a peça e conferir o entalhe a olho, coisa que a tela achata.',
  },
  {
    id: 'immersive-ar',
    nome: 'Pela câmera',
    tratamentoDoMundo: 'preserva',
    espacoDeReferencia: 'local-floor',
    rastreia:
      'a pose do aparelho e as superfícies reais que ele encontra — a mesa onde a ' +
      'bancada será ancorada',
    registroContra:
      'uma superfície real escolhida no ambiente, à qual a bancada permanece presa ' +
      '(em escala 1:2) enquanto a pessoa caminha em volta',
    composicaoEsperada: 'alpha-blend',
    papel:
      'É o único regime em que errar o registro é visível a olho nu: a bancada ' +
      'desliza sobre a mesa, e ninguém precisa de instrumento para notar.',
  },
];

export function regimePorId(id: RegimeId): Regime {
  const encontrado: Regime | undefined = REGIMES.find((regime) => regime.id === id);
  if (encontrado === undefined) {
    // Inalcançável enquanto REGIMES cobrir RegimeId. O lançamento existe para o
    // caso de alguém acrescentar um id ao tipo e esquecer a entrada.
    throw new Error(`Regime não declarado: ${id}`);
  }
  return encontrado;
}
