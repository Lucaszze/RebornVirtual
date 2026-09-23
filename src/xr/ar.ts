// ---------------------------------------------------------------------------
// A ancoragem pela câmera: encontrar a mesa real e pousar a bancada sobre ela.
//
// Usa o hit-test da API XR para lançar um raio contra as superfícies reais e
// desenhar um anel onde a mira encontra a mesa. O primeiro toque pousa a bancada
// naquele ponto, em escala 1:2 (Seção 4), e a partir daí ela fica presa ao mundo:
// andar em volta e vê-la parada é o teste que separa registro de desenho sobre
// vídeo (Seção 2).
//
// Só funciona dentro de uma sessão de câmera com a feature 'hit-test'. Sem ela,
// a fonte nunca é criada, o anel nunca aparece, e o motivo é uma capacidade que
// falta no aparelho — não um erro do código (é o que a Seção 11 pede).
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import type { ContextoXr } from './contexto';

/** Escala do regime de câmera: 1:2 por padrão (Seção 4). */
const ESCALA_CAMERA = 0.5;

export interface AncoragemAr {
  update(frame: XRFrame): void;
}

export function setupAr(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  raiz: THREE.Group,
  contexto: ContextoXr,
): AncoragemAr {
  const anel = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4f7cff }),
  );
  anel.matrixAutoUpdate = false;
  anel.visible = false;
  scene.add(anel);

  let fonteHitTest: XRHitTestSource | null = null;
  let solicitada = false;

  const controller = renderer.xr.getController(0);
  controller.addEventListener('select', () => {
    // Só pousa pela câmera, e só enquanto ainda não pousou. Depois disso o toque
    // volta a pertencer aos controles, que apanham peças.
    if (contexto.modo !== 'camera' || contexto.arPousada || !anel.visible) {
      return;
    }
    raiz.position.setFromMatrixPosition(anel.matrix);
    raiz.scale.setScalar(ESCALA_CAMERA);
    raiz.visible = true;
    contexto.arPousada = true;
    anel.visible = false;
  });
  scene.add(controller);

  return {
    update(frame: XRFrame): void {
      if (contexto.modo !== 'camera' || contexto.arPousada) {
        anel.visible = false;
        return;
      }

      const session = renderer.xr.getSession();
      if (!session) {
        return;
      }
      const referencia = renderer.xr.getReferenceSpace();
      if (!referencia) {
        return;
      }

      if (!solicitada) {
        solicitada = true;
        session.requestReferenceSpace('viewer').then((espacoDoVisor) => {
          session.requestHitTestSource?.({ space: espacoDoVisor })?.then((fonte) => {
            fonteHitTest = fonte;
          });
        });
        session.addEventListener('end', () => {
          solicitada = false;
          fonteHitTest = null;
        });
      }

      if (!fonteHitTest) {
        return;
      }

      const resultados = frame.getHitTestResults(fonteHitTest);
      if (resultados.length > 0) {
        const pose = resultados[0].getPose(referencia);
        if (pose) {
          anel.visible = true;
          anel.matrix.fromArray(pose.transform.matrix);
        }
      } else {
        anel.visible = false;
      }
    },
  };
}
