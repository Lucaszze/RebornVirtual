// ---------------------------------------------------------------------------
// A oficina: a bancada, o gabinete aberto, as seis peças e o ambiente mínimo.
//
// É a entrega do Bloco 2 (Seção 13): a cena estática, corretamente dimensionada,
// pronta para ser vista nos três regimes. A câmera e as luzes moram aqui; o
// renderer, os controles e os botões de sessão ficam no main, porque são a
// máquina, não a cena.
//
// A raiz que se ancora no mundo (bancada + gabinete + peças) é separada do
// ambiente (chão e parede). Pela câmera, o ambiente some — o mundo real toma o
// lugar dele — e só a raiz é pousada sobre a mesa. É também a ordem da
// degradação da Seção 10: o ambiente é o primeiro a sair.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import { ALTURA_DO_TAMPO, PECAS, criarMalhaDaPeca } from './pecas';

const LARGURA_BANCADA = 1.6;
const PROFUNDIDADE_BANCADA = 0.8;
const ESPESSURA_TAMPO = 0.06;

const GABINETE = { largura: 0.46, altura: 0.21, profundidade: 0.45, parede: 0.012 };

export class Oficina {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  /** O que se ancora no mundo real pela câmera: bancada, gabinete e peças. */
  readonly raiz = new THREE.Group();
  /** Chão e parede decorativos — o "Ambiente" da Seção 3, oculto em AR. */
  readonly ambiente = new THREE.Group();
  /** As peças que a mira pode apontar e apanhar. */
  readonly interactive: THREE.Object3D[] = [];

  constructor() {
    this.scene.background = new THREE.Color(0x101015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    // De pé, diante do tampo, olhando para dentro do gabinete.
    this.camera.position.set(0, 1.65, 1.15);

    this.montarLuzes();
    this.montarAmbiente();
    this.montarBancada();
    this.montarGabinete();
    this.montarPecas();

    this.scene.add(this.ambiente);
    this.scene.add(this.raiz);
  }

  /** Ponto para onde a órbita da tela aponta: o interior do gabinete. */
  get alvo(): THREE.Vector3 {
    return new THREE.Vector3(0, ALTURA_DO_TAMPO + 0.1, 0);
  }

  private montarLuzes(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 1.1);
    hemi.position.set(0, 1, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(1.2, 3, 1.5);
    this.scene.add(dir);
  }

  private montarAmbiente(): void {
    const grade = new THREE.GridHelper(6, 24, 0x3f5bbf, 0x25252f);
    this.ambiente.add(grade);

    const parede = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 1 }),
    );
    parede.position.set(0, 1.5, -1.4);
    this.ambiente.add(parede);
  }

  private montarBancada(): void {
    const madeira = new THREE.MeshStandardMaterial({ color: 0x6b4f34, roughness: 0.8 });

    const tampo = new THREE.Mesh(
      new THREE.BoxGeometry(LARGURA_BANCADA, ESPESSURA_TAMPO, PROFUNDIDADE_BANCADA),
      madeira,
    );
    tampo.position.set(0, ALTURA_DO_TAMPO - ESPESSURA_TAMPO / 2, 0);
    tampo.receiveShadow = true;
    this.raiz.add(tampo);

    // Quatro pés, do chão até o tampo.
    const alturaPe = ALTURA_DO_TAMPO - ESPESSURA_TAMPO;
    const pe = new THREE.BoxGeometry(0.06, alturaPe, 0.06);
    const dx = LARGURA_BANCADA / 2 - 0.08;
    const dz = PROFUNDIDADE_BANCADA / 2 - 0.08;
    for (const [x, z] of [
      [-dx, -dz],
      [dx, -dz],
      [-dx, dz],
      [dx, dz],
    ] as const) {
      const malha = new THREE.Mesh(pe, madeira);
      malha.position.set(x, alturaPe / 2, z);
      this.raiz.add(malha);
    }
  }

  private montarGabinete(): void {
    const metal = new THREE.MeshStandardMaterial({
      color: 0x33343a,
      roughness: 0.5,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });
    const grupo = new THREE.Group();
    const { largura, altura, profundidade, parede } = GABINETE;

    // Fundo (a bandeja onde a placa-mãe assenta).
    const fundo = new THREE.Mesh(new THREE.BoxGeometry(largura, parede, profundidade), metal);
    fundo.position.set(0, parede / 2, 0);
    grupo.add(fundo);

    // Três paredes baixas; a de cima (voltada a quem monta) fica aberta, porque
    // o gabinete está "deitado e com a tampa removida" (Seção 3).
    const traseira = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, parede), metal);
    traseira.position.set(0, altura / 2, -profundidade / 2 + parede / 2);
    grupo.add(traseira);

    const lateral = new THREE.BoxGeometry(parede, altura, profundidade);
    const esquerda = new THREE.Mesh(lateral, metal);
    esquerda.position.set(-largura / 2 + parede / 2, altura / 2, 0);
    grupo.add(esquerda);
    const direita = new THREE.Mesh(lateral, metal);
    direita.position.set(largura / 2 - parede / 2, altura / 2, 0);
    grupo.add(direita);

    grupo.position.set(0, ALTURA_DO_TAMPO, 0);
    this.raiz.add(grupo);
  }

  private montarPecas(): void {
    for (const def of PECAS) {
      const malha = criarMalhaDaPeca(def);
      this.raiz.add(malha);
      this.interactive.push(malha);
    }
  }

  /** Descrição textual da árvore da cena, para a folha do relatório. */
  estrutura(): string {
    return (
      `Bancada ${LARGURA_BANCADA} × ${PROFUNDIDADE_BANCADA} m, tampo a ${ALTURA_DO_TAMPO} m. ` +
      `Gabinete aberto ${GABINETE.largura} × ${GABINETE.profundidade} × ${GABINETE.altura} m. ` +
      `${PECAS.length} peças móveis sobre o tampo, todas em escala real.`
    );
  }

  /** Laço de animação. A cena é estática no Bloco 2; nada a animar por ora. */
  update(_delta: number): void {
    // Reservado para a acomodação do encaixe e a ventoinha ao ligar (Bloco 4).
  }
}
