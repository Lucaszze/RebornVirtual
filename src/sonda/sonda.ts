// ---------------------------------------------------------------------------
// A sonda de capacidades (Bloco 1 do plano, Seção 13).
//
// Ela pergunta ao aparelho o que ele oferece e guarda a resposta numa estrutura
// que o resto do ambiente possa consultar. Não desenha, não carrega malha e não
// monta cena: o que ela produz é conhecimento sobre o aparelho, e é isso que os
// blocos seguintes consomem para decidir o que sequer tentar (Seção 11, item 1).
//
// Duas restrições da plataforma moldam o arquivo, e nenhuma é contornável:
//
// 1. Metade das respostas só existe DENTRO de uma sessão. Recursos concedidos,
//    modo de composição do fundo, espaços de referência entregues e fontes de
//    entrada são propriedades da sessão, não do navegador.
// 2. Abrir sessão imersiva exige gesto de quem usa. O navegador recusa o pedido
//    que não venha de um clique — daí a sonda completa ser chamada por botão.
// ---------------------------------------------------------------------------

import { REGIMES, type Regime, type RegimeId } from '../regimes/regimes';
import { levantarRelatorio, type LinhaDoRelatorio } from '../regimes/verificacao';
import {
  RECURSOS_CONSULTADOS,
  estadoDoRecurso,
  type EstadoDeRecurso,
} from './recursos';
import {
  ContadorDeEstabilidade,
  diagnosticar,
  type Estabilidade,
} from './estabilidade';
import {
  classificarAparelho,
  grausDeLiberdade,
  type ClasseDeAparelho,
  type GrausDeLiberdade,
} from './graus';

/** Modos em que uma sessão de sondagem pode ser aberta. */
export type ModoSondavel = 'immersive-vr' | 'immersive-ar';

/** Espaços de referência que a sonda tenta obter, do mais exigente ao mínimo. */
const ESPACOS_TENTADOS: readonly XRReferenceSpaceType[] = [
  'bounded-floor',
  'local-floor',
  'unbounded',
  'local',
  'viewer',
];

/** Quantos quadros a sonda observa antes de encerrar a sessão. */
const QUADROS_OBSERVADOS: number = 90;

export interface RecursoSondado {
  readonly nome: string;
  readonly paraQueServe: string;
  readonly estado: EstadoDeRecurso;
}

export interface FonteDeEntradaSondada {
  /** Lado declarado: `left`, `right` ou `none`. */
  readonly lado: string;
  /** Como a mira é produzida: raio de controle, olhar ou toque na tela. */
  readonly mira: string;
  /** Há pose de punho — objeto rastreado no espaço, não apenas uma direção. */
  readonly temPoseDePunho: boolean;
  /** Há pose de mão articulada. */
  readonly temMao: boolean;
  /** Perfis declarados pelo aparelho, do mais específico ao mais genérico. */
  readonly perfis: readonly string[];
}

/** O que a sonda descobre sem abrir sessão alguma. */
export interface SondaSemSessao {
  readonly temApiXr: boolean;
  readonly contextoSeguro: boolean;
  readonly regimes: readonly LinhaDoRelatorio[];
  readonly modosSuportados: readonly string[];
}

/** O que só a sessão responde. */
export interface SondaEmSessao {
  readonly modo: ModoSondavel;
  readonly recursos: readonly RecursoSondado[];
  readonly espacosConcedidos: readonly string[];
  readonly composicaoObservada: XREnvironmentBlendMode;
  readonly fontesDeEntrada: readonly FonteDeEntradaSondada[];
  readonly graus: GrausDeLiberdade;
  readonly estabilidade: Estabilidade;
  readonly diagnostico: string;
}

export interface ResultadoDaSonda {
  readonly semSessao: SondaSemSessao;
  readonly emSessao: SondaEmSessao | undefined;
  /** Por que não houve sessão, quando não houve. */
  readonly motivoSemSessao: string | undefined;
  readonly classe: ClasseDeAparelho;
}

// A API XR não é exposta fora de contexto seguro. O sintoma é idêntico ao de um
// aparelho sem suporte, e a causa é a URL — o erro de laboratório mais frequente
// do percurso, e o que mais custa tempo por parecer defeito de código.
function contextoSeguro(): boolean {
  return window.isSecureContext;
}

export async function sondarSemSessao(): Promise<SondaSemSessao> {
  const regimes: LinhaDoRelatorio[] = await levantarRelatorio();
  const suportados: string[] = regimes
    .filter((linha) => linha.suporte === 'sim')
    .map((linha) => linha.regime.id);

  return {
    temApiXr: navigator.xr !== undefined,
    contextoSeguro: contextoSeguro(),
    regimes,
    modosSuportados: suportados,
  };
}

/**
 * Tenta obter cada espaço de referência e devolve os que vieram. O pedido
 * rejeita quando o espaço não é concedido, e é essa rejeição que informa — o
 * `catch` vazio não esconde erro algum: ele é a leitura.
 */
async function espacosConcedidos(sessao: XRSession): Promise<string[]> {
  const obtidos: string[] = [];
  for (const tipo of ESPACOS_TENTADOS) {
    try {
      await sessao.requestReferenceSpace(tipo);
      obtidos.push(tipo);
    } catch {
      // Espaço não concedido. É resposta, não falha.
    }
  }
  return obtidos;
}

function lerFontesDeEntrada(sessao: XRSession): FonteDeEntradaSondada[] {
  const fontes: FonteDeEntradaSondada[] = [];
  for (const fonte of sessao.inputSources) {
    fontes.push({
      lado: fonte.handedness,
      mira: fonte.targetRayMode,
      temPoseDePunho: fonte.gripSpace !== undefined,
      temMao: fonte.hand !== undefined,
      perfis: [...fonte.profiles],
    });
  }
  return fontes;
}

/**
 * A camada de composição mínima. A especificação da API só entrega quadros a uma
 * sessão que tenha superfície de composição declarada. Não desenhamos nada nela:
 * ela é a condição para o laço de quadros existir durante a sondagem.
 */
function camadaMinima(sessao: XRSession): void {
  const tela: HTMLCanvasElement = document.createElement('canvas');
  const gl: WebGL2RenderingContext | null = tela.getContext('webgl2', {
    xrCompatible: true,
  });
  if (gl === null) {
    throw new Error('Este navegador não entregou contexto WebGL 2 compatível com XR.');
  }
  sessao.updateRenderState({ baseLayer: new XRWebGLLayer(sessao, gl) });
}

/** Observa alguns quadros, contando os que vieram sem pose de quem observa. */
function observarQuadros(
  sessao: XRSession,
  referencia: XRReferenceSpace,
): Promise<Estabilidade> {
  return new Promise<Estabilidade>((resolver) => {
    const contador: ContadorDeEstabilidade = new ContadorDeEstabilidade();
    let restantes: number = QUADROS_OBSERVADOS;

    const passo: XRFrameRequestCallback = (_tempo: number, quadro: XRFrame): void => {
      const pose: XRViewerPose | undefined = quadro.getViewerPose(referencia);
      contador.registrar(pose !== undefined, sessao.visibilityState === 'visible');
      restantes -= 1;
      if (restantes > 0) {
        sessao.requestAnimationFrame(passo);
        return;
      }
      resolver(contador.resultado());
    };

    sessao.requestAnimationFrame(passo);
  });
}

export async function sondarEmSessao(modo: ModoSondavel): Promise<SondaEmSessao> {
  const xr: XRSystem | undefined = navigator.xr;
  if (xr === undefined) {
    throw new Error('Não há API XR neste navegador.');
  }

  // Todo recurso vai como opcional. Passar qualquer um como obrigatório faria o
  // aparelho recusar a sessão inteira por causa de um item — e a sonda perderia
  // justamente a informação que veio buscar.
  const sessao: XRSession = await xr.requestSession(modo, {
    optionalFeatures: RECURSOS_CONSULTADOS.map((recurso) => recurso.nome),
  });

  try {
    camadaMinima(sessao);
    const concedidos: readonly string[] | undefined = sessao.enabledFeatures;
    const espacos: string[] = await espacosConcedidos(sessao);
    const referencia: XRReferenceSpace = await sessao.requestReferenceSpace(
      espacos.includes('local-floor') ? 'local-floor' : 'viewer',
    );
    const estabilidade: Estabilidade = await observarQuadros(sessao, referencia);
    const fontes: FonteDeEntradaSondada[] = lerFontesDeEntrada(sessao);

    return {
      modo,
      recursos: RECURSOS_CONSULTADOS.map((recurso) => ({
        nome: recurso.nome,
        paraQueServe: recurso.paraQueServe,
        estado: estadoDoRecurso(recurso.nome, concedidos),
      })),
      espacosConcedidos: espacos,
      composicaoObservada: sessao.environmentBlendMode,
      fontesDeEntrada: fontes,
      graus: grausDeLiberdade({
        concedidos: espacos,
        modo,
        comPoseDePunho: fontes.some((fonte) => fonte.temPoseDePunho),
      }),
      estabilidade,
      diagnostico: diagnosticar(estabilidade),
    };
  } finally {
    // A sessão precisa terminar mesmo quando a sondagem falha no meio. Sessão
    // imersiva viva com página parada prende o visor numa tela vazia.
    await sessao.end();
  }
}

/** Escolhe o modo mais informativo entre os que o aparelho declara suportar. */
export function modoPreferido(
  modosSuportados: readonly string[],
): ModoSondavel | undefined {
  const ordem: readonly ModoSondavel[] = ['immersive-ar', 'immersive-vr'];
  return ordem.find((modo) => modosSuportados.includes(modo));
}

export async function sondar(): Promise<ResultadoDaSonda> {
  const semSessao: SondaSemSessao = await sondarSemSessao();
  const modo: ModoSondavel | undefined = modoPreferido(semSessao.modosSuportados);

  if (modo === undefined) {
    return {
      semSessao,
      emSessao: undefined,
      motivoSemSessao: semSessao.temApiXr
        ? 'Este aparelho não declara sessão imersiva alguma, e metade da sonda não tem onde acontecer. É informação sobre o aparelho, não defeito do código.'
        : 'Sem API XR neste navegador. Se a página não está em contexto seguro, a causa é a URL, e não o aparelho.',
      classe: classificarAparelho(
        semSessao.modosSuportados,
        'indeterminado',
        semSessao.temApiXr,
      ),
    };
  }

  const emSessao: SondaEmSessao = await sondarEmSessao(modo);
  return {
    semSessao,
    emSessao,
    motivoSemSessao: undefined,
    classe: classificarAparelho(
      semSessao.modosSuportados,
      emSessao.graus,
      semSessao.temApiXr,
    ),
  };
}

/**
 * Confronta a composição declarada nos regimes com a que a sessão informou. É o
 * primeiro ponto em que uma declaração nossa pode ser desmentida pelo aparelho,
 * e o desmentido é o resultado mais valioso dos dois.
 */
export function conferirComposicao(emSessao: SondaEmSessao): string {
  const id: RegimeId = emSessao.modo;
  const regime: Regime | undefined = REGIMES.find((candidato) => candidato.id === id);
  if (regime === undefined) {
    return 'O regime sondado não consta da declaração de regimes.';
  }
  if (regime.composicaoEsperada === emSessao.composicaoObservada) {
    return `A composição declarada (${regime.composicaoEsperada}) foi confirmada pela sessão.`;
  }
  return (
    `Declaramos composição ${regime.composicaoEsperada} e a sessão informou ` +
    `${emSessao.composicaoObservada}. A declaração estava errada, e quem tem razão é o aparelho.`
  );
}
