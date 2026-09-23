// ---------------------------------------------------------------------------
// Catálogo dos recursos opcionais que a sonda consulta, e a classificação do
// que o aparelho respondeu sobre cada um.
//
// Este arquivo existe para separar duas coisas que o vocabulário corrente
// confunde: o recurso que o aparelho NÃO TEM e o recurso que ele TEM e NÃO
// CONCEDEU. A API XR trata os dois de um jeito só na hora de pedir — passam
// ambos por `optionalFeatures` e simplesmente não aparecem depois —, e por isso
// a distinção precisa ser feita aqui, à mão.
//
// O terceiro estado é o que mais evita erro: `indeterminado`. A sessão só
// reporta o que concedeu através de `enabledFeatures`, e essa propriedade é
// opcional na especificação — um navegador pode entrar em sessão sem dizer o que
// ligou. Sem o terceiro estado, esse navegador apareceria como aparelho que
// negou tudo.
// ---------------------------------------------------------------------------

/**
 * O que se sabe sobre um recurso depois de a sessão abrir.
 *
 * - `concedido`: o nome está em `enabledFeatures`, e o recurso pode ser usado.
 * - `negado`: a sessão reportou a lista e o nome não está nela.
 * - `indeterminado`: a sessão não reportou lista alguma. Não é negativa; é
 *   ausência de resposta, e tratá-la como negativa produz relatório errado.
 */
export type EstadoDeRecurso = 'concedido' | 'negado' | 'indeterminado';

/** Um recurso opcional da API XR, com o motivo de ele estar no catálogo. */
export interface RecursoOpcional {
  /** O nome exato aceito por `optionalFeatures` — não traduzir. */
  readonly nome: string;
  /** O que ele habilita na montagem, em uma frase. */
  readonly paraQueServe: string;
}

/**
 * Os recursos que a bancada consulta. A lista é curta de propósito: pedir tudo
 * faria a sonda demorar e algumas plataformas recusarem a sessão inteira por
 * causa de um item exótico. Cada entrada aqui serve a algo que a especificação
 * pede.
 *
 * `depth-sensing` ficou de fora por ser técnico: ele exige um dicionário de
 * configuração próprio no pedido, e um pedido malformado derruba a sessão
 * inteira em vez de apenas negar o recurso.
 */
export const RECURSOS_CONSULTADOS: readonly RecursoOpcional[] = [
  {
    nome: 'local-floor',
    paraQueServe:
      'origem no chão do espaço físico — é o que faz a bancada nascer à altura de 0,95 m (Seção 4)',
  },
  {
    nome: 'bounded-floor',
    paraQueServe:
      'origem no chão mais os limites da área livre, para acender a grade de segurança ao cruzar a borda (Seção 11)',
  },
  {
    nome: 'unbounded',
    paraQueServe: 'espaço sem fronteira declarada, para andar em volta da bancada ancorada',
  },
  {
    nome: 'hit-test',
    paraQueServe:
      'lançar um raio contra a mesa real para encontrar onde pousar a bancada pela câmera',
  },
  {
    nome: 'anchors',
    paraQueServe:
      'prender a bancada a um ponto do mapa e deixar o aparelho corrigi-la enquanto a pessoa anda',
  },
  {
    nome: 'plane-detection',
    paraQueServe: 'receber os planos (a mesa) que o aparelho reconheceu no ambiente',
  },
  {
    nome: 'dom-overlay',
    paraQueServe:
      'sobrepor o painel de mensagens à imagem da câmera, para as recusas serem lidas em AR',
  },
  {
    nome: 'hand-tracking',
    paraQueServe:
      'pose das mãos sem controle — fora do núcleo da montagem, consultado só para registro',
  },
];

/**
 * Classifica um recurso contra a lista que a sessão reportou. `concedidos` vem
 * de `XRSession.enabledFeatures`, que é opcional: `undefined` significa "esta
 * sessão não diz", e é o que produz `indeterminado`.
 */
export function estadoDoRecurso(
  nome: string,
  concedidos: readonly string[] | undefined,
): EstadoDeRecurso {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  return concedidos.includes(nome) ? 'concedido' : 'negado';
}
