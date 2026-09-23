// ---------------------------------------------------------------------------
// Os controles rastreados do visor: apontar, apanhar e soltar.
//
// É a mesma abstração da Seção 5 (apontar / apanhar / soltar), aqui no regime do
// visor. O apontamento é um raio que sai da mão; o gatilho apanha a peça mirada
// e o soltar a devolve à cena mantendo a posição no mundo. O encaixe de verdade,
// com as três recusas, é o Bloco 3 — por ora, apanhar e soltar já existem para a
// cena poder ser manipulada no visor.
//
// `podeApanhar` é o portão: pela câmera, apanhar só vale depois de a bancada ter
// sido pousada, para o primeiro toque não tentar apanhar peça enquanto ainda
// escolhe onde a bancada nasce.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export interface Controles {
  update(): void;
}

export function setupControles(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  interactive: THREE.Object3D[],
  podeApanhar: () => boolean,
): Controles {
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const modelFactory = new XRControllerModelFactory();

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const rayLine = new THREE.Line(
    rayGeometry,
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  rayLine.scale.z = 5;

  const controllers: THREE.XRTargetRaySpace[] = [];
  const selected = new Map<THREE.XRTargetRaySpace, THREE.Object3D>();
  const realcadas: THREE.MeshStandardMaterial[] = [];

  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.add(rayLine.clone());
    scene.add(controller);

    controller.addEventListener('selectstart', () => onSelectStart(controller));
    controller.addEventListener('selectend', () => onSelectEnd(controller));
    controllers.push(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.add(modelFactory.createControllerModel(grip));
    scene.add(grip);
  }

  function intersect(controller: THREE.XRTargetRaySpace): THREE.Intersection | null {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(interactive, false);
    return hits.length > 0 ? hits[0] : null;
  }

  function onSelectStart(controller: THREE.XRTargetRaySpace): void {
    if (!podeApanhar()) {
      return;
    }
    const hit = intersect(controller);
    if (hit) {
      const obj = hit.object;
      controller.attach(obj); // "gruda" a peça na mão
      selected.set(controller, obj);
    }
  }

  function onSelectEnd(controller: THREE.XRTargetRaySpace): void {
    const obj = selected.get(controller);
    if (obj) {
      scene.attach(obj); // solta de volta na cena, mantendo a posição no mundo
      selected.delete(controller);
    }
  }

  return {
    update(): void {
      for (const material of realcadas) {
        material.emissive.setHex(0x000000);
      }
      realcadas.length = 0;

      if (!podeApanhar()) {
        return;
      }

      for (const controller of controllers) {
        if (selected.has(controller)) {
          continue;
        }
        const hit = intersect(controller);
        const mesh = hit?.object as THREE.Mesh | undefined;
        const mat = mesh?.material as THREE.MeshStandardMaterial | undefined;
        if (mat && 'emissive' in mat) {
          mat.emissive.setHex(0x333333);
          realcadas.push(mat);
        }
      }
    },
  };
}
