// ---------------------------------------------------------------------------
// Manipulação na tela: apontar, apanhar, girar e soltar com o mouse (Seção 5).
//
// O clique apanha a peça mirada; ela passa a acompanhar o cursor num plano
// horizontal acima da bancada, e o clique seguinte a solta. Arrastar (segurar e
// mover) gira a câmera pela órbita e não seleciona nada — por isso a seleção só
// acontece num clique curto, sem arrasto. Com a peça na mão, Q/E a giram em torno
// do eixo vertical e R/F em torno do lateral.
//
// Quem decide se encaixou é o ambiente, no instante de soltar (Seção 6). A peça
// recusada permanece na mão (Seção 8), para a pessoa girar, reposicionar e tentar
// de novo sem ter de apanhá-la outra vez.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ALTURA_DO_TAMPO } from '../cena/pecas';
import { Encaixe, fraseDaRecusa } from '../cena/encaixe';

/** Altura em que a peça flutua enquanto é carregada. */
const ALTURA_DA_MAO = ALTURA_DO_TAMPO + 0.12;
/** Fora deste raio (m) do centro, a peça solta volta ao ponto de origem. */
const ZONA_UTIL = 0.7;
/** Movimento (px) abaixo do qual um toque conta como clique, não arrasto. */
const LIMIAR_DE_CLIQUE = 6;
/** Velocidade do giro por tecla, em radianos por segundo. */
const VELOCIDADE_DE_GIRO = Math.PI / 2;

export type TipoDeResposta = 'aceito' | 'recusa' | 'neutro';

export interface OpcoesManipulacao {
  readonly dom: HTMLElement;
  readonly camera: THREE.PerspectiveCamera;
  readonly raiz: THREE.Group;
  /** O gabinete: pai das peças que travam nele (placa-mãe e fonte). */
  readonly gabinete: THREE.Object3D;
  readonly interactive: THREE.Object3D[];
  readonly encaixe: Encaixe;
  readonly orbit: OrbitControls;
  readonly ativo: () => boolean;
  readonly aoResponder: (texto: string, tipo: TipoDeResposta) => void;
  /** Linha só para o diário (a conferência em números da troca de pai). */
  readonly aoRegistrar: (texto: string) => void;
}

interface Retorno {
  readonly malha: THREE.Object3D;
  readonly de: THREE.Vector3;
  readonly para: THREE.Vector3;
  readonly deQuat: THREE.Quaternion;
  readonly paraQuat: THREE.Quaternion;
  tempo: number;
}

export interface Manipulacao {
  update(delta: number): void;
}

export function setupManipulacao(opcoes: OpcoesManipulacao): Manipulacao {
  const { dom, camera, raiz, gabinete, interactive, encaixe, orbit, ativo, aoResponder, aoRegistrar } =
    opcoes;

  const raycaster = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ALTURA_DA_MAO);
  const pontoNoPlano = new THREE.Vector3();

  let segurada: THREE.Mesh | null = null;
  // A placa-mãe já instalada: as peças montadas nela (pentes, SSD, dissipador)
  // passam a ser suas filhas, e não do gabinete diretamente.
  let placaInstalada: THREE.Object3D | null = null;
  let realcada: THREE.MeshStandardMaterial | null = null;
  let fantasma: THREE.Mesh | null = null;
  const teclas = new Set<string>();
  const retornos: Retorno[] = [];

  const inicioDoToque = new THREE.Vector2();
  let arrastou = false;

  // Silhuetas translúcidas dos assentos (Seção 8): uma por lugar, escondidas.
  const silhuetas = new Map<string, THREE.Mesh>();
  for (const lugar of encaixe.lugares) {
    const [w, h, d] = lugar.tamanhoAssento;
    const silhueta = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: 0x4f7cff, transparent: true, opacity: 0.28 }),
    );
    silhueta.position.copy(lugar.alvo);
    silhueta.rotation.y = THREE.MathUtils.degToRad(lugar.giroYAlvo);
    silhueta.visible = false;
    raiz.add(silhueta);
    silhuetas.set(lugar.id, silhueta);
  }

  function pescaveis(): THREE.Object3D[] {
    return interactive.filter(
      (o) => o !== segurada && o.userData.travada !== true && o.userData.retornando !== true,
    );
  }

  function atualizarPonteiro(evento: PointerEvent): void {
    const rect = dom.getBoundingClientRect();
    ponteiro.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    ponteiro.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function limparRealce(): void {
    if (realcada !== null) {
      realcada.emissive.setHex(0x000000);
      realcada = null;
    }
  }

  function atualizarRealce(): void {
    limparRealce();
    raycaster.setFromCamera(ponteiro, camera);
    const alvos = raycaster.intersectObjects(pescaveis(), false);
    const material = (alvos[0]?.object as THREE.Mesh | undefined)?.material as
      | THREE.MeshStandardMaterial
      | undefined;
    if (material && 'emissive' in material) {
      material.emissive.setHex(0x2a2a2a);
      realcada = material;
    }
  }

  function moverParaOPonteiro(): void {
    raycaster.setFromCamera(ponteiro, camera);
    if (segurada !== null && raycaster.ray.intersectPlane(plano, pontoNoPlano)) {
      segurada.position.set(pontoNoPlano.x, ALTURA_DA_MAO, pontoNoPlano.z);
    }
  }

  function mostrarSilhuetaMaisProxima(): void {
    for (const silhueta of silhuetas.values()) {
      silhueta.visible = false;
    }
    if (segurada === null) {
      return;
    }
    const perto = encaixe.lugarMaisProximo(segurada.position);
    if (perto !== undefined) {
      silhuetas.get(perto.lugar.id)!.visible = true;
    }
  }

  function criarFantasma(peca: THREE.Mesh): void {
    const [w, h, d] = peca.userData.tamanho as [number, number, number];
    const marca = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }),
    );
    const origem = peca.userData.origem as THREE.Vector3;
    marca.position.copy(origem);
    marca.rotation.y = peca.userData.origemGiroY as number;
    raiz.add(marca);
    fantasma = marca;
  }

  function removerFantasma(): void {
    if (fantasma !== null) {
      raiz.remove(fantasma);
      fantasma.geometry.dispose();
      (fantasma.material as THREE.Material).dispose();
      fantasma = null;
    }
  }

  function apanhar(): void {
    raycaster.setFromCamera(ponteiro, camera);
    const alvos = raycaster.intersectObjects(pescaveis(), false);
    const peca = alvos[0]?.object as THREE.Mesh | undefined;
    if (peca === undefined) {
      return;
    }
    limparRealce();
    segurada = peca;
    peca.position.y = ALTURA_DA_MAO;
    criarFantasma(peca);
    orbit.enabled = false;
    aoResponder(
      `Apanhou ${peca.userData.nome}. Gire com Q/E (vertical) e R/F (lateral); clique de novo para soltar.`,
      'neutro',
    );
  }

  /**
   * O pai de uma peça ao travar. A placa-mãe e a fonte entram no gabinete; os
   * componentes de placa (pentes, SSD, dissipador) entram na PLACA-MÃE, que já
   * está instalada por causa da ordem parcial (Seção 6). Fica assim a árvore da
   * montagem real: mover a placa move o que está nela.
   */
  function paiDoEncaixe(lugarId: string): THREE.Object3D {
    if (lugarId === 'placa-mae' || lugarId === 'fonte') {
      return gabinete;
    }
    return placaInstalada ?? gabinete;
  }

  function formatar(v: THREE.Vector3): string {
    return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
  }

  function soltar(): void {
    const peca = segurada;
    if (peca === null) {
      return;
    }
    const veredito = encaixe.avaliar(
      peca.userData.categoria as string,
      peca.position,
      peca.quaternion,
    );

    if (veredito.tipo === 'recusa') {
      // A peça permanece na mão para nova tentativa (Seção 8).
      aoResponder(fraseDaRecusa(veredito.recusa), 'recusa');
      return;
    }

    if (veredito.tipo === 'travou') {
      const { lugar, distanciaCm } = veredito;

      // 1) Assenta a peça na pose exata do encaixe, ainda como filha da raiz.
      peca.position.copy(lugar.alvo);
      peca.rotation.set(0, THREE.MathUtils.degToRad(lugar.giroYAlvo), 0);
      peca.updateMatrixWorld(true);

      // 2) Troca de pai preservando a posição no mundo, e confere em números:
      //    o desvio antes/depois é a prova de que o .attach preserva o mundo.
      const antes = peca.getWorldPosition(new THREE.Vector3());
      const pai = paiDoEncaixe(lugar.id);
      pai.attach(peca);
      peca.updateMatrixWorld(true);
      const depois = peca.getWorldPosition(new THREE.Vector3());
      const desvio = antes.distanceTo(depois);
      const nomePai = pai === gabinete ? 'o gabinete' : 'a placa-mãe';

      peca.userData.travada = true;
      const indice = interactive.indexOf(peca);
      if (indice >= 0) {
        interactive.splice(indice, 1);
      }
      if (peca.userData.categoria === 'placa-mae') {
        placaInstalada = peca;
      }

      liberar();
      aoResponder(`Encaixe aceito: ${lugar.nome} travou (a ${distanciaCm} cm do alvo).`, 'aceito');
      aoRegistrar(
        `Troca de pai: ${peca.userData.nome} passou a pertencer a ${nomePai}. ` +
          `Posição no mundo antes ${formatar(antes)}, depois ${formatar(depois)}; ` +
          `desvio de ${desvio.toExponential(2)} m (o .attach preservou o mundo).`,
      );
      if (encaixe.completo) {
        aoResponder('Montagem completa: as seis peças travaram.', 'aceito');
      }
      return;
    }

    // Longe de qualquer encaixe: pousa na bancada, ou volta à origem se saiu da zona.
    const [, altura] = peca.userData.tamanho as [number, number, number];
    const distanciaDoCentro = Math.hypot(peca.position.x, peca.position.z);
    if (distanciaDoCentro > ZONA_UTIL) {
      agendarRetorno(peca);
      liberar();
      aoResponder('Fora da zona útil: a peça volta ao ponto de origem.', 'neutro');
      return;
    }
    peca.position.y = ALTURA_DO_TAMPO + altura / 2;
    liberar();
    aoResponder(
      `Fora de encaixe: ficou a ${veredito.distanciaCm} cm do lugar mais próximo. A peça pousou na bancada.`,
      'neutro',
    );
  }

  function liberar(): void {
    removerFantasma();
    for (const silhueta of silhuetas.values()) {
      silhueta.visible = false;
    }
    segurada = null;
    orbit.enabled = true;
  }

  function agendarRetorno(peca: THREE.Mesh): void {
    peca.userData.retornando = true;
    const paraQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, peca.userData.origemGiroY as number, 0),
    );
    retornos.push({
      malha: peca,
      de: peca.position.clone(),
      para: (peca.userData.origem as THREE.Vector3).clone(),
      deQuat: peca.quaternion.clone(),
      paraQuat,
      tempo: 0,
    });
  }

  function processarRetornos(delta: number): void {
    for (let i = retornos.length - 1; i >= 0; i--) {
      const r = retornos[i];
      r.tempo += delta;
      const t = Math.min(r.tempo / 2, 1); // 2 segundos (Seção 5)
      r.malha.position.lerpVectors(r.de, r.para, t);
      r.malha.quaternion.slerpQuaternions(r.deQuat, r.paraQuat, t);
      if (t >= 1) {
        r.malha.userData.retornando = false;
        retornos.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Eventos de ponteiro e teclado
  // -------------------------------------------------------------------------
  dom.addEventListener('pointerdown', (evento) => {
    if (!ativo()) {
      return;
    }
    atualizarPonteiro(evento);
    inicioDoToque.set(evento.clientX, evento.clientY);
    arrastou = false;
  });

  dom.addEventListener('pointermove', (evento) => {
    if (!ativo()) {
      return;
    }
    atualizarPonteiro(evento);
    if (Math.hypot(evento.clientX - inicioDoToque.x, evento.clientY - inicioDoToque.y) > LIMIAR_DE_CLIQUE) {
      arrastou = true;
    }
    if (segurada !== null) {
      moverParaOPonteiro();
      mostrarSilhuetaMaisProxima();
    } else {
      atualizarRealce();
    }
  });

  dom.addEventListener('pointerup', (evento) => {
    if (!ativo()) {
      return;
    }
    atualizarPonteiro(evento);
    if (segurada !== null) {
      soltar();
      return;
    }
    if (!arrastou) {
      apanhar();
    }
  });

  window.addEventListener('keydown', (evento) => {
    teclas.add(evento.key.toLowerCase());
  });
  window.addEventListener('keyup', (evento) => {
    teclas.delete(evento.key.toLowerCase());
  });

  return {
    update(delta: number): void {
      processarRetornos(delta);
      if (!ativo()) {
        return;
      }
      if (segurada !== null) {
        const passo = VELOCIDADE_DE_GIRO * delta;
        if (teclas.has('q')) segurada.rotateY(passo);
        if (teclas.has('e')) segurada.rotateY(-passo);
        if (teclas.has('r')) segurada.rotateX(passo);
        if (teclas.has('f')) segurada.rotateX(-passo);
      }
    },
  };
}
