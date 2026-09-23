// ---------------------------------------------------------------------------
// O estado que os módulos de interação compartilham.
//
// Pequeno de propósito: qual regime está ativo e, pela câmera, se a bancada já
// foi pousada sobre a mesa. É o que permite ao hit-test e aos controles não
// pisarem um no outro — antes de pousar, o toque escolhe onde a bancada nasce;
// depois de pousada, o mesmo toque volta a apanhar peças (Seção 9).
// ---------------------------------------------------------------------------

export type ModoAtivo = 'tela' | 'visor' | 'camera';

export interface ContextoXr {
  modo: ModoAtivo;
  /** Pela câmera: a bancada já foi ancorada numa superfície real. */
  arPousada: boolean;
}

export function criarContexto(): ContextoXr {
  return { modo: 'tela', arPousada: false };
}
