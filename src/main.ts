// ---------------------------------------------------------------------------
// A máquina que junta tudo: a cena sobe, a sonda pergunta ao aparelho, e os três
// regimes (tela, visor, câmera) abrem a MESMA bancada com o mesmo código.
//
// A página tem três tempos, como a Seção 13 pede. A cena sobe ao carregar — o
// regime de tela não pede gesto de ninguém e é o caso base. O que se responde
// sem sessão (quais regimes o aparelho declara) aparece logo abaixo. O que só a
// sessão responde — a sonda completa e a entrada no visor ou na câmera — espera
// um toque, porque o navegador recusa sessão imersiva que não venha de gesto.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Oficina } from './cena/oficina';
import { setupControles } from './xr/controles';
import { setupAr } from './xr/ar';
import { criarContexto } from './xr/contexto';

import { sondarSemSessao, sondar, conferirComposicao } from './sonda/sonda';
import type { ResultadoDaSonda, SondaSemSessao } from './sonda/sonda';
import { suporteDoRegime, type Suporte } from './regimes/verificacao';
import type { RegimeId } from './regimes/regimes';
import { montarRegimes, montarSonda } from './relatorio/relatorio';
import { Diario, explicarFalha } from './relatorio/diario';

// ---------------------------------------------------------------------------
// Elementos da página
// ---------------------------------------------------------------------------
function exigirElemento(id: string): HTMLElement {
  const elemento = document.getElementById(id);
  if (elemento === null) {
    throw new Error(`A página não tem o elemento #${id}.`);
  }
  return elemento;
}

const cenaEl = exigirElemento('cena');
const acoesEl = exigirElemento('acoes');
const relatorioEl = exigirElemento('relatorio');
const sondaEl = exigirElemento('sonda');
const diarioEl = exigirElemento('diario');
const painelEl = exigirElemento('painel');
const recolherBtn = exigirElemento('recolher') as HTMLButtonElement;

const diario = new Diario();
diario.fixarDestino(diarioEl);

// ---------------------------------------------------------------------------
// Renderer, cena e câmera
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
cenaEl.appendChild(renderer.domElement);

const oficina = new Oficina();
const fundoOriginal = oficina.scene.background;

const orbit = new OrbitControls(oficina.camera, renderer.domElement);
orbit.target.copy(oficina.alvo);
orbit.enableDamping = true;
orbit.update();

const contexto = criarContexto();

// Pela câmera, apanhar só vale depois de a bancada estar pousada.
const controles = setupControles(
  renderer,
  oficina.scene,
  oficina.interactive,
  () => contexto.modo !== 'camera' || contexto.arPousada,
);
const ancoragem = setupAr(renderer, oficina.scene, oficina.raiz, contexto);

// ---------------------------------------------------------------------------
// Botões de sessão: só habilitados quando o aparelho confirma o suporte
// (Seção 11, item 1). O motivo da recusa fica escrito ao lado, nunca um botão
// morto sem explicação.
// ---------------------------------------------------------------------------
const botaoVr = document.createElement('button');
const botaoAr = document.createElement('button');
const botaoSair = document.createElement('button');
const botaoSondar = document.createElement('button');

botaoSondar.textContent = 'Sondar este aparelho';
botaoVr.textContent = 'Entrar no visor';
botaoAr.textContent = 'Entrar pela câmera';
botaoSair.textContent = 'Sair da sessão';

botaoVr.disabled = true;
botaoAr.disabled = true;
botaoSair.disabled = true;

acoesEl.append(botaoSondar, botaoVr, botaoAr, botaoSair);

function habilitarPorSuporte(botao: HTMLButtonElement, suporte: Suporte, regime: string): void {
  if (suporte === 'sim') {
    botao.disabled = false;
    botao.title = '';
    return;
  }
  botao.disabled = true;
  botao.title =
    suporte === 'nao'
      ? `Este aparelho não entra no regime "${regime}". É informação sobre o aparelho.`
      : `Ainda não dá para saber se este aparelho entra no regime "${regime}" (sem API XR ou fora de HTTPS).`;
}

// ---------------------------------------------------------------------------
// Ciclo de sessão: um handler só, porque a sessão pode terminar sem este código
// pedir (menu do sistema, bateria, tirar o visor do rosto).
// ---------------------------------------------------------------------------
renderer.xr.addEventListener('sessionstart', () => {
  const session = renderer.xr.getSession();
  const naCamera = session !== null && session.environmentBlendMode !== 'opaque';
  contexto.modo = naCamera ? 'camera' : 'visor';
  contexto.arPousada = false;

  orbit.enabled = false;
  botaoSair.disabled = false;
  botaoVr.disabled = true;
  botaoAr.disabled = true;

  if (naCamera) {
    // Pela câmera o mundo real toma o lugar do ambiente: fundo transparente,
    // chão e parede fora, e a bancada só aparece depois de pousada na mesa.
    oficina.scene.background = null;
    oficina.ambiente.visible = false;
    oficina.raiz.visible = false;
    diario.nota(
      'Sessão de câmera aberta. Aponte para a mesa até o anel azul aparecer e toque para pousar a ' +
        'bancada (escala 1:2). Depois, ande em volta: ela deve ficar parada sobre a mesa.',
    );
  } else {
    diario.nota(
      'Sessão de visor aberta. A bancada nasce à altura do tampo (0,95 m); o raio do controle aponta ' +
        'e o gatilho apanha as peças — o mesmo código da tela.',
    );
  }
});

renderer.xr.addEventListener('sessionend', () => {
  contexto.modo = 'tela';
  contexto.arPousada = false;

  // Devolve a cena ao estado de janela.
  oficina.scene.background = fundoOriginal;
  oficina.ambiente.visible = true;
  oficina.raiz.visible = true;
  oficina.raiz.position.set(0, 0, 0);
  oficina.raiz.scale.setScalar(1);

  orbit.enabled = true;
  botaoSair.disabled = true;
  aplicarSuporte(ultimoSemSessao);
  diario.nota('Sessão encerrada. O regime voltou à janela, e a câmera à órbita da bancada.');
});

async function entrarEm(modo: RegimeId): Promise<void> {
  const xr = navigator.xr;
  if (modo === 'inline' || xr === undefined) {
    diario.falha('Não há API XR para abrir esta sessão neste navegador.');
    return;
  }
  try {
    const init: XRSessionInit =
      modo === 'immersive-ar'
        ? {
            requiredFeatures: [],
            optionalFeatures: [
              'local-floor',
              'bounded-floor',
              'hit-test',
              'anchors',
              'plane-detection',
              'dom-overlay',
            ],
            domOverlay: { root: document.body },
          }
        : { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
    const session = await xr.requestSession(modo, init);
    await renderer.xr.setSession(session);
  } catch (erro: unknown) {
    // Sessão que não abre é resultado, não acidente — e precisa ser lida no
    // próprio aparelho (Seção 11, item 2).
    diario.falha(explicarFalha(erro));
  }
}

botaoVr.addEventListener('click', () => void entrarEm('immersive-vr'));
botaoAr.addEventListener('click', () => void entrarEm('immersive-ar'));
botaoSair.addEventListener('click', () => {
  void renderer.xr.getSession()?.end();
});

// ---------------------------------------------------------------------------
// A sonda: a parte sem sessão roda ao carregar; a completa espera o botão.
// ---------------------------------------------------------------------------
let ultimoSemSessao: SondaSemSessao | undefined;

function aplicarSuporte(semSessao: SondaSemSessao | undefined): void {
  if (semSessao === undefined) {
    return;
  }
  habilitarPorSuporte(botaoVr, suporteDoRegime(semSessao.regimes, 'immersive-vr'), 'No visor');
  habilitarPorSuporte(botaoAr, suporteDoRegime(semSessao.regimes, 'immersive-ar'), 'Pela câmera');
}

void sondarSemSessao()
  .then((semSessao) => {
    ultimoSemSessao = semSessao;
    montarRegimes(relatorioEl, semSessao.regimes);
    aplicarSuporte(semSessao);
    diario.nota(
      'Cena montada e regimes consultados. ' + oficina.estrutura() + ' A sonda completa espera o botão.',
    );
    if (!semSessao.contextoSeguro) {
      diario.alerta(
        'A página não está em contexto seguro (HTTPS). O visor e a câmera ficam indisponíveis por causa ' +
          'disso, e não por falta de suporte do aparelho.',
      );
    }
  })
  .catch((erro: unknown) => diario.falha(explicarFalha(erro)));

async function executarSonda(): Promise<void> {
  botaoSondar.disabled = true;
  botaoSondar.textContent = 'Sondando...';
  diario.nota('Sondando. Se um visor pedir permissão, aceite: sem ela a sessão não abre.');
  try {
    const resultado: ResultadoDaSonda = await sondar();
    const confronto =
      resultado.emSessao === undefined ? undefined : conferirComposicao(resultado.emSessao);
    montarSonda(sondaEl, resultado, confronto);
    diario.nota('Sondagem concluída e sessão encerrada.');
  } catch (erro: unknown) {
    diario.falha(explicarFalha(erro));
  } finally {
    botaoSondar.disabled = false;
    botaoSondar.textContent = 'Sondar este aparelho';
  }
}

botaoSondar.addEventListener('click', () => void executarSonda());

// ---------------------------------------------------------------------------
// Recolher o painel, para a bancada aparecer sem folha por cima.
// ---------------------------------------------------------------------------
recolherBtn.addEventListener('click', () => {
  const oculto = painelEl.hasAttribute('hidden');
  if (oculto) {
    painelEl.removeAttribute('hidden');
    recolherBtn.textContent = 'Recolher o painel';
  } else {
    painelEl.setAttribute('hidden', '');
    recolherBtn.textContent = 'Mostrar o painel';
  }
});

// ---------------------------------------------------------------------------
// Laço de animação (setAnimationLoop, não requestAnimationFrame, por causa do XR)
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();

renderer.setAnimationLoop((_tempo, frame) => {
  const delta = clock.getDelta();
  if (!renderer.xr.isPresenting) {
    orbit.update();
  }
  oficina.update(delta);
  controles.update();
  if (frame) {
    ancoragem.update(frame);
  }
  renderer.render(oficina.scene, oficina.camera);
});

// ---------------------------------------------------------------------------
// Responsividade
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  oficina.camera.aspect = window.innerWidth / window.innerHeight;
  oficina.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
