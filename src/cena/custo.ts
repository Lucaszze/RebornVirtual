// ---------------------------------------------------------------------------
// O painel de custo do quadro, preso à bancada e lido de dentro da cena.
//
// É o passo 9 da demonstração: o "número medido" que a especificação (Seção 10)
// exige — quadros por segundo, tempo de quadro, triângulos e chamadas de desenho.
// Fica diegético, numa placa atrás da bancada (o "Painel" da Seção 3), desenhado
// numa textura de canvas e atualizado a cada meio segundo. Assim o número existe
// no visor e pela câmera, e não só no console de quem programou.
//
// Os valores de triângulos e chamadas vêm de `renderer.info`, que o Three.js
// preenche a cada `render()`. O tempo de quadro é medido aqui, pela média dos
// deltas do laço — o mesmo `clock.getDelta()` que move a cena.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import { ALTURA_DO_TAMPO } from './pecas';

export class PainelDeCusto {
  readonly mesh: THREE.Mesh;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly textura: THREE.CanvasTexture;

  private acumulado = 0;
  private quadros = 0;
  private qps = 0;
  private ms = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    const ctx = this.canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('Este navegador não entregou contexto 2D para o painel de custo.');
    }
    this.ctx = ctx;

    this.textura = new THREE.CanvasTexture(this.canvas);
    this.textura.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: this.textura });
    // Placa de 0,5 × 0,25 m, atrás da bancada e voltada a quem monta (Seção 3).
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), material);
    this.mesh.name = 'painel-de-custo';
    this.mesh.position.set(0, ALTURA_DO_TAMPO + 0.42, -0.44);

    this.desenhar();
  }

  /** Acumula o tempo do laço e, a cada meio segundo, recalcula e redesenha. */
  registrar(delta: number): void {
    this.acumulado += delta;
    this.quadros += 1;
    if (this.acumulado >= 0.5) {
      this.qps = this.quadros / this.acumulado;
      this.ms = (this.acumulado / this.quadros) * 1000;
      this.acumulado = 0;
      this.quadros = 0;
      this.desenhar();
    }
  }

  private desenhar(): void {
    const info = this.renderer.info;
    const ctx = this.ctx;

    ctx.fillStyle = '#12131a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('Custo do quadro', 20, 44);

    ctx.font = '26px monospace';
    const linhas: string[] = [
      `${this.qps.toFixed(0)} qps    ${this.ms.toFixed(1)} ms/quadro`,
      `triangulos: ${info.render.triangles}`,
      `draw calls: ${info.render.calls}`,
      `geometrias: ${info.memory.geometries}   texturas: ${info.memory.textures}`,
    ];
    let y = 92;
    for (const linha of linhas) {
      ctx.fillText(linha, 20, y);
      y += 38;
    }

    this.textura.needsUpdate = true;
  }
}
