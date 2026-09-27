// ---------------------------------------------------------------------------
// O encaixe: os lugares, as folgas, a ordem parcial e o veredito (Seções 6 e 7).
//
// Cada lugar guarda o identificador da única categoria de peça que aceita e um
// estado (vazio ou travado). O travamento só acontece quando, no instante de
// soltar, as três condições valem ao mesmo tempo: (a) a categoria da peça confere
// com a do lugar; (b) posição e ângulo estão dentro das folgas; (c) as
// precedências estão satisfeitas. É a validação da Seção 6, sem verificação vaga
// no fim: se as seis travas exigiram as três condições, o estado final é válido
// por construção.
//
// Pela Regra de Ouro (Seção 1), a recusa diz a CATEGORIA do erro e para por aí —
// nunca qual peça é a certa, qual o sentido, nem o que falta antes.
// ---------------------------------------------------------------------------

import * as THREE from 'three';

/** Distância (m) dentro da qual consideramos que a pessoa mirou um lugar. */
const RAIO_DE_TENTATIVA = 0.1;

/** Além deste ângulo (graus) a peça está virada ao contrário, não desalinhada. */
const LIMIAR_DE_INVERSAO = 90;

export interface LugarDef {
  readonly id: string;
  readonly nome: string;
  /** A categoria de peça que este lugar aceita. */
  readonly aceita: string;
  /** Posição de trava, em coordenadas da raiz (= mundo no regime de tela). */
  readonly alvo: THREE.Vector3;
  /** Orientação de trava, em graus em torno do eixo vertical. */
  readonly giroYAlvo: number;
  /** Folga de posição (m) e de ângulo (graus), da Seção 7. */
  readonly folgaPos: number;
  readonly folgaAng: number;
  /** Ids de lugares que precisam estar travados antes deste (Seção 6). */
  readonly requer: readonly string[];
  /** Tamanho do assento, para desenhar a silhueta translúcida (Seção 8). */
  readonly tamanhoAssento: readonly [number, number, number];
}

export type Recusa = 'peca-errada' | 'sentido-errado' | 'ordem-errada';

export type Veredito =
  | { readonly tipo: 'travou'; readonly lugar: LugarDef; readonly distanciaCm: number }
  | { readonly tipo: 'recusa'; readonly recusa: Recusa; readonly lugar: LugarDef }
  | { readonly tipo: 'longe'; readonly distanciaCm: number };

/**
 * Os seis lugares, dentro do gabinete (centrado em 0, 0,95, 0). A ordem parcial
 * da Seção 6: a placa-mãe primeiro; os dois pentes antes do dissipador; a fonte
 * livre.
 */
export const LUGARES: readonly LugarDef[] = [
  {
    id: 'placa-mae',
    nome: 'a placa-mãe no gabinete',
    aceita: 'placa-mae',
    alvo: new THREE.Vector3(0, 0.968, 0),
    giroYAlvo: 0,
    folgaPos: 0.05,
    folgaAng: 20,
    requer: [],
    tamanhoAssento: [0.305, 0.004, 0.244],
  },
  {
    id: 'pente-a',
    nome: 'o primeiro pente na placa',
    aceita: 'pente',
    alvo: new THREE.Vector3(0.05, 0.976, -0.07),
    giroYAlvo: 0,
    folgaPos: 0.03,
    folgaAng: 15,
    requer: ['placa-mae'],
    tamanhoAssento: [0.133, 0.008, 0.031],
  },
  {
    id: 'pente-b',
    nome: 'o segundo pente na placa',
    aceita: 'pente',
    alvo: new THREE.Vector3(0.05, 0.976, 0.01),
    giroYAlvo: 0,
    folgaPos: 0.03,
    folgaAng: 15,
    requer: ['placa-mae'],
    tamanhoAssento: [0.133, 0.008, 0.031],
  },
  {
    id: 'ssd',
    nome: 'o SSD no conector',
    aceita: 'ssd',
    alvo: new THREE.Vector3(-0.09, 0.972, 0.06),
    giroYAlvo: 0,
    folgaPos: 0.025,
    folgaAng: 15,
    requer: ['placa-mae'],
    tamanhoAssento: [0.08, 0.003, 0.022],
  },
  {
    id: 'dissipador',
    nome: 'o dissipador sobre o soquete',
    aceita: 'dissipador',
    alvo: new THREE.Vector3(-0.05, 0.99, -0.05),
    giroYAlvo: 0,
    folgaPos: 0.04,
    folgaAng: 20,
    requer: ['placa-mae', 'pente-a', 'pente-b'],
    tamanhoAssento: [0.12, 0.08, 0.1],
  },
  {
    id: 'fonte',
    nome: 'a fonte no nicho',
    aceita: 'fonte',
    alvo: new THREE.Vector3(0.15, 0.99, -0.12),
    giroYAlvo: 0,
    folgaPos: 0.05,
    folgaAng: 20,
    requer: [],
    tamanhoAssento: [0.15, 0.086, 0.14],
  },
];

function distanciaXZ(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

/** Diferença angular (graus) entre a peça e a orientação alvo de um lugar. */
function diferencaAngular(quaternion: THREE.Quaternion, giroYAlvo: number): number {
  const alvo = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, THREE.MathUtils.degToRad(giroYAlvo), 0),
  );
  return THREE.MathUtils.radToDeg(quaternion.angleTo(alvo));
}

export class Encaixe {
  private readonly travados = new Set<string>();

  get lugares(): readonly LugarDef[] {
    return LUGARES;
  }

  estaTravado(id: string): boolean {
    return this.travados.has(id);
  }

  get quantidadeTravada(): number {
    return this.travados.size;
  }

  get completo(): boolean {
    return this.travados.size === LUGARES.length;
  }

  /** O lugar vazio mais próximo de um ponto, se dentro do raio de tentativa. */
  lugarMaisProximo(posicao: THREE.Vector3): { lugar: LugarDef; distancia: number } | undefined {
    let melhor: { lugar: LugarDef; distancia: number } | undefined;
    for (const lugar of LUGARES) {
      if (this.travados.has(lugar.id)) {
        continue;
      }
      const distancia = distanciaXZ(posicao, lugar.alvo);
      if (melhor === undefined || distancia < melhor.distancia) {
        melhor = { lugar, distancia };
      }
    }
    if (melhor !== undefined && melhor.distancia <= RAIO_DE_TENTATIVA) {
      return melhor;
    }
    return undefined;
  }

  /**
   * O veredito no instante de soltar. A ordem das perguntas é a da Regra de Ouro:
   * primeiro se o lugar é desta peça, depois se é a vez dela, depois o sentido, e
   * só então posição e ângulo finos.
   */
  avaliar(
    categoria: string,
    posicao: THREE.Vector3,
    quaternion: THREE.Quaternion,
  ): Veredito {
    const candidato = this.lugarMaisProximo(posicao);
    if (candidato === undefined) {
      // Fora de alcance de qualquer lugar: a menor distância a um lugar vazio.
      let menor = Infinity;
      for (const lugar of LUGARES) {
        if (!this.travados.has(lugar.id)) {
          menor = Math.min(menor, distanciaXZ(posicao, lugar.alvo));
        }
      }
      return { tipo: 'longe', distanciaCm: Math.round(menor * 100) };
    }

    const { lugar, distancia } = candidato;

    if (lugar.aceita !== categoria) {
      return { tipo: 'recusa', recusa: 'peca-errada', lugar };
    }
    if (!lugar.requer.every((id) => this.travados.has(id))) {
      return { tipo: 'recusa', recusa: 'ordem-errada', lugar };
    }

    const ang = diferencaAngular(quaternion, lugar.giroYAlvo);
    if (ang > LIMIAR_DE_INVERSAO) {
      return { tipo: 'recusa', recusa: 'sentido-errado', lugar };
    }

    if (distancia <= lugar.folgaPos && ang <= lugar.folgaAng) {
      this.travados.add(lugar.id);
      return { tipo: 'travou', lugar, distanciaCm: Math.round(distancia * 100) };
    }

    // Peça certa, na vez certa, mais ou menos no sentido, mas ainda não assentou.
    return { tipo: 'longe', distanciaCm: Math.round(distancia * 100) };
  }
}

/** A frase de cada recusa, exatamente como a Seção 5 as define. */
export function fraseDaRecusa(recusa: Recusa): string {
  switch (recusa) {
    case 'peca-errada':
      return 'Este lugar não é desta peça.';
    case 'sentido-errado':
      return 'Peça certa, sentido errado: o entalhe não coincide.';
    case 'ordem-errada':
      return 'Ainda não é a vez desta peça: falta algo antes.';
  }
}
