// ---------------------------------------------------------------------------
// Confronto entre o que declaramos e o que o aparelho oferece.
//
// A declaração de regimes envelhece bem demais: continua parecendo certa muito
// depois de ter deixado de ser. Este arquivo faz a pergunta correspondente ao
// navegador em que a página está aberta — a mais grossa possível, "este aparelho
// entra neste regime?" — e devolve as duas colunas lado a lado.
//
// O que ele NÃO faz: não abre sessão, não mede graus de liberdade, não enumera
// fontes de entrada. Isso é a sonda de capacidades (src/sonda), que só a sessão
// responde.
// ---------------------------------------------------------------------------

import { REGIMES, type Regime, type RegimeId } from './regimes';

/**
 * `desconhecido` não é sinônimo de `nao`. O navegador sem a API XR não está
 * dizendo que o aparelho não serve — está dizendo que não sabe responder, e
 * tratar as duas coisas como a mesma é o erro que faz um relatório honesto virar
 * um relatório confiante e errado.
 */
export type Suporte = 'sim' | 'nao' | 'desconhecido';

export interface LinhaDoRelatorio {
  readonly regime: Regime;
  readonly suporte: Suporte;
  readonly observacao: string;
}

/** A API XR do navegador, quando existe. */
function sistemaXr(): XRSystem | undefined {
  return navigator.xr;
}

async function suporteDe(id: RegimeId): Promise<Suporte> {
  const xr: XRSystem | undefined = sistemaXr();
  if (xr === undefined) {
    return 'desconhecido';
  }
  try {
    const suportado: boolean = await xr.isSessionSupported(id);
    return suportado ? 'sim' : 'nao';
  } catch {
    // Alguns navegadores rejeitam a promessa em vez de devolver `false` — para
    // um modo que não reconhecem, ou fora de contexto seguro. Nos dois casos o
    // que se sabe é que não houve resposta utilizável.
    return 'desconhecido';
  }
}

function observacaoDe(regime: Regime, suporte: Suporte): string {
  if (suporte === 'sim') {
    return `Declarado com registro contra ${regime.registroContra}. Falta confrontar em sessão.`;
  }
  if (suporte === 'nao') {
    return 'Este aparelho não entra neste regime. É informação sobre o aparelho, não defeito do código.';
  }
  return 'Sem API XR neste navegador, ou página fora de contexto seguro (HTTPS).';
}

export async function levantarRelatorio(): Promise<LinhaDoRelatorio[]> {
  const linhas: LinhaDoRelatorio[] = [];
  for (const regime of REGIMES) {
    const suporte: Suporte = await suporteDe(regime.id);
    linhas.push({ regime, suporte, observacao: observacaoDe(regime, suporte) });
  }
  return linhas;
}

/** O suporte declarado para um regime específico, para gatear botões. */
export function suporteDoRegime(
  linhas: readonly LinhaDoRelatorio[],
  id: RegimeId,
): Suporte {
  return linhas.find((linha) => linha.regime.id === id)?.suporte ?? 'desconhecido';
}
