// ---------------------------------------------------------------------------
// As folhas do relatório: a dos regimes (pergunta grossa, sem sessão) e a da
// sonda (o que o aparelho concede, uma vez dentro).
//
// A apresentação aqui é em tabela de HTML comum, sobreposta à cena. A Seção 8
// prevê que o retorno definitivo seja diegético — o painel preso à bancada —, e
// quando ele existir por inteiro é este arquivo que muda de lugar, e nada mais.
// ---------------------------------------------------------------------------

import type { LinhaDoRelatorio, Suporte } from '../regimes/verificacao';
import type { EstadoDeRecurso } from '../sonda/recursos';
import { descreverClasse, type GrausDeLiberdade } from '../sonda/graus';
import type { ResultadoDaSonda, SondaEmSessao } from '../sonda/sonda';
import { celula, paragrafo, subtitulo } from './comum';

function rotuloDoSuporte(suporte: Suporte): string {
  switch (suporte) {
    case 'sim':
      return 'entra';
    case 'nao':
      return 'não entra';
    case 'desconhecido':
      return 'não sei responder';
  }
}

/** A folha dos regimes: o que o aparelho responde sem sessão alguma. */
export function montarRegimes(raiz: HTMLElement, linhas: readonly LinhaDoRelatorio[]): void {
  raiz.replaceChildren();

  const titulo: HTMLHeadingElement = document.createElement('h2');
  titulo.textContent = 'Os três regimes, e o que este aparelho declara';
  raiz.appendChild(titulo);

  const tabela: HTMLTableElement = document.createElement('table');
  const cabecalho: HTMLTableRowElement = tabela.insertRow();
  for (const t of ['Regime', 'Entra?', 'Observação']) {
    cabecalho.appendChild(celula(t, true));
  }
  for (const linha of linhas) {
    const fileira: HTMLTableRowElement = tabela.insertRow();
    fileira.appendChild(celula(linha.regime.nome));
    fileira.appendChild(celula(rotuloDoSuporte(linha.suporte)));
    fileira.appendChild(celula(linha.observacao));
  }
  raiz.appendChild(tabela);

  if (!window.isSecureContext) {
    const aviso: HTMLParagraphElement = paragrafo(
      'A página NÃO está em contexto seguro (HTTPS). O WebXR fica indisponível por causa disso, ' +
        'e não por falta de suporte do aparelho — abra a mesma URL por https para perguntar de verdade.',
    );
    aviso.style.color = '#b8860b';
    raiz.appendChild(aviso);
  }
}

function rotuloDoEstado(estado: EstadoDeRecurso): string {
  switch (estado) {
    case 'concedido':
      return 'concedido';
    case 'negado':
      return 'não concedido';
    case 'indeterminado':
      return 'sem resposta';
  }
}

function rotuloDosGraus(graus: GrausDeLiberdade): string {
  switch (graus) {
    case 'tres':
      return 'três graus de liberdade — acompanha para onde a cabeça aponta, não para onde ela vai';
    case 'seis':
      return 'seis graus de liberdade — acompanha orientação e deslocamento';
    case 'indeterminado':
      return 'indeterminado — os espaços concedidos não bastam para afirmar nem uma coisa nem outra';
  }
}

function tabelaDeRecursos(sonda: SondaEmSessao): HTMLTableElement {
  const tabela: HTMLTableElement = document.createElement('table');
  const cabecalho: HTMLTableRowElement = tabela.insertRow();
  for (const t of ['Recurso', 'Para que serve', 'Neste aparelho']) {
    cabecalho.appendChild(celula(t, true));
  }
  for (const recurso of sonda.recursos) {
    const fileira: HTMLTableRowElement = tabela.insertRow();
    fileira.appendChild(celula(recurso.nome));
    fileira.appendChild(celula(recurso.paraQueServe));
    fileira.appendChild(celula(rotuloDoEstado(recurso.estado)));
  }
  return tabela;
}

function tabelaDeFontes(sonda: SondaEmSessao): HTMLElement {
  if (sonda.fontesDeEntrada.length === 0) {
    return paragrafo(
      'Nenhuma fonte de entrada foi declarada durante a sondagem. Num visor, costuma significar ' +
        'controle desligado ou fora de alcance; num aparelho de mão, é o esperado até o primeiro toque.',
    );
  }
  const tabela: HTMLTableElement = document.createElement('table');
  const cabecalho: HTMLTableRowElement = tabela.insertRow();
  for (const t of ['Lado', 'Mira', 'Pose de punho', 'Mão', 'Perfis']) {
    cabecalho.appendChild(celula(t, true));
  }
  for (const fonte of sonda.fontesDeEntrada) {
    const fileira: HTMLTableRowElement = tabela.insertRow();
    fileira.appendChild(celula(fonte.lado));
    fileira.appendChild(celula(fonte.mira));
    fileira.appendChild(celula(fonte.temPoseDePunho ? 'sim' : 'não'));
    fileira.appendChild(celula(fonte.temMao ? 'sim' : 'não'));
    fileira.appendChild(celula(fonte.perfis.join(', ')));
  }
  return tabela;
}

/**
 * A folha da sonda. `confronto` compara a composição declarada com a que a
 * sessão informou, e vem pronta de fora porque quem a produz é a sonda, não a
 * apresentação.
 */
export function montarSonda(
  raiz: HTMLElement,
  resultado: ResultadoDaSonda,
  confronto: string | undefined,
): void {
  raiz.replaceChildren();

  const titulo: HTMLHeadingElement = document.createElement('h2');
  titulo.textContent = 'Sonda de capacidades';
  raiz.appendChild(titulo);

  raiz.appendChild(paragrafo(descreverClasse(resultado.classe)));
  raiz.appendChild(
    paragrafo(
      resultado.semSessao.contextoSeguro
        ? 'A página está em contexto seguro, então a ausência de um recurso é resposta do aparelho.'
        : 'A página NÃO está em contexto seguro. Nada abaixo é informação sobre o aparelho: é a URL impedindo a pergunta.',
    ),
  );

  const sonda: SondaEmSessao | undefined = resultado.emSessao;
  if (sonda === undefined) {
    raiz.appendChild(
      paragrafo(resultado.motivoSemSessao ?? 'Não houve sessão, e o motivo não foi registrado.'),
    );
    return;
  }

  raiz.appendChild(subtitulo(`Recursos opcionais pedidos em ${sonda.modo}`));
  raiz.appendChild(tabelaDeRecursos(sonda));

  raiz.appendChild(subtitulo('Espaços de referência e graus de liberdade'));
  raiz.appendChild(
    paragrafo(
      sonda.espacosConcedidos.length === 0
        ? 'Nenhum espaço de referência foi concedido.'
        : `Concedidos: ${sonda.espacosConcedidos.join(', ')}.`,
    ),
  );
  raiz.appendChild(paragrafo(rotuloDosGraus(sonda.graus)));

  raiz.appendChild(subtitulo('Fontes de entrada declaradas'));
  raiz.appendChild(tabelaDeFontes(sonda));

  raiz.appendChild(subtitulo('Composição do fundo'));
  raiz.appendChild(paragrafo(`A sessão informou composição ${sonda.composicaoObservada}.`));
  if (confronto !== undefined) {
    raiz.appendChild(paragrafo(confronto));
  }

  raiz.appendChild(subtitulo('Estabilidade do rastreamento na janela observada'));
  raiz.appendChild(
    paragrafo(
      `${sonda.estabilidade.quadros} quadros observados, ` +
        `${sonda.estabilidade.quadrosSemPose} sem pose, ` +
        `${sonda.estabilidade.quadrosOcultos} com a sessão fora de primeiro plano.`,
    ),
  );
  raiz.appendChild(paragrafo(sonda.diagnostico));
}
