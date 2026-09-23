// ---------------------------------------------------------------------------
// As seis peças móveis e o gabinete, com as dimensões da Seção 4.
//
// Para o Bloco 2 (cena estática) todas as formas são construídas por código, em
// tamanho real (1 unidade = 1 metro). Os quatro modelos de forma complexa —
// gabinete, placa-mãe, dissipador e fonte — serão trocados por glTF importado no
// Bloco 2 da disciplina, quando a tabela de ativos da Seção 12 estiver fechada;
// até lá, entram como caixas dimensionadas corretamente, o que já basta para
// provar que a cena está em escala nos três regimes.
//
// Pentes e SSD ficam no código de propósito (Seção 3): o entalhe deles é regra
// de jogo e precisa sair geometricamente exato. Aqui o entalhe já aparece como
// marca assimétrica, para que "sentido certo" e "sentido errado" sejam legíveis
// a olho desde já.
// ---------------------------------------------------------------------------

import * as THREE from 'three';

/** Altura do tampo da bancada, em metros (Seção 4). */
export const ALTURA_DO_TAMPO = 0.95;

export interface PecaDef {
  readonly id: string;
  readonly nome: string;
  /** Dimensões [largura, altura, profundidade] em metros. */
  readonly tamanho: readonly [number, number, number];
  readonly cor: number;
  /** Onde a peça repousa sobre o tampo, no plano [x, z] a partir do centro. */
  readonly pousoXZ: readonly [number, number];
  /** Giro em torno do eixo vertical, em graus. 180 = "virada ao contrário". */
  readonly giroY: number;
  /** Se tem entalhe assimétrico visível (pentes e SSD). */
  readonly temEntalhe: boolean;
}

/**
 * As seis peças, com posições dentro da zona de alcance (≤ 0,60 m do centro,
 * Seção 4) e algumas viradas ao contrário de propósito (Seção 6).
 */
export const PECAS: readonly PecaDef[] = [
  {
    id: 'placa-mae',
    nome: 'Placa-mãe',
    tamanho: [0.305, 0.004, 0.244], // ATX 30,5 × 24,4 cm
    cor: 0x2f7d4f,
    pousoXZ: [-0.42, 0.06],
    giroY: 0,
    temEntalhe: false,
  },
  {
    id: 'pente-1',
    nome: 'Pente de memória',
    tamanho: [0.133, 0.008, 0.031], // 13,3 × 3,1 × 0,8 cm
    cor: 0x2b3a67,
    pousoXZ: [0.38, -0.22],
    giroY: 0,
    temEntalhe: true,
  },
  {
    id: 'pente-2',
    nome: 'Pente de memória',
    tamanho: [0.133, 0.008, 0.031],
    cor: 0x2b3a67,
    pousoXZ: [0.46, 0.03],
    giroY: 180, // virado ao contrário: o entalhe não coincide (Seção 6)
    temEntalhe: true,
  },
  {
    id: 'dissipador',
    nome: 'Dissipador',
    tamanho: [0.12, 0.08, 0.1], // 12 × 10 × 8 cm (altura das aletas para cima)
    cor: 0x9aa0a6,
    pousoXZ: [0.4, 0.26],
    giroY: 0,
    temEntalhe: false,
  },
  {
    id: 'fonte',
    nome: 'Fonte',
    tamanho: [0.15, 0.086, 0.14], // 15 × 14 × 8,6 cm
    cor: 0x3a3a42,
    pousoXZ: [-0.44, -0.24],
    giroY: 180, // invertida: ventoinha para o lado errado (Seção 7)
    temEntalhe: false,
  },
  {
    id: 'ssd',
    nome: 'SSD M.2',
    tamanho: [0.08, 0.003, 0.022], // 2280: 8,0 × 2,2 cm
    cor: 0xb08d57,
    pousoXZ: [0.14, 0.3],
    giroY: 0,
    temEntalhe: true,
  },
];

/**
 * Constrói a malha de uma peça, já posicionada sobre o tampo e girada. O ponto
 * de origem fica guardado em `userData.origem` para a Seção 5 ("solta fora de
 * encaixe volta ao ponto de origem"), e `userData.id`/`nome` identificam a peça
 * para as recusas do Bloco 3.
 */
export function criarMalhaDaPeca(def: PecaDef): THREE.Mesh {
  const [largura, altura, profundidade] = def.tamanho;
  const geometria = new THREE.BoxGeometry(largura, altura, profundidade);
  const material = new THREE.MeshStandardMaterial({
    color: def.cor,
    roughness: 0.55,
    metalness: 0.25,
  });
  const malha = new THREE.Mesh(geometria, material);

  const [x, z] = def.pousoXZ;
  malha.position.set(x, ALTURA_DO_TAMPO + altura / 2, z);
  malha.rotation.y = THREE.MathUtils.degToRad(def.giroY);
  malha.castShadow = true;

  // O entalhe assimétrico: uma marca escura numa das pontas. Como ela não fica
  // no centro, girar a peça 180° a leva para o outro lado — e é exatamente essa
  // não-coincidência que o encaixe vai recusar como "sentido errado" (Seção 7).
  if (def.temEntalhe) {
    const marca = new THREE.Mesh(
      new THREE.BoxGeometry(largura * 0.12, altura * 1.02, profundidade * 1.02),
      new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.8 }),
    );
    marca.position.x = largura * 0.32;
    malha.add(marca);
  }

  malha.userData.id = def.id;
  malha.userData.nome = def.nome;
  malha.userData.origem = malha.position.clone();
  return malha;
}
