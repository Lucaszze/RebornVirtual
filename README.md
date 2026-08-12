# RebornVirtual

O mínimo necessário para iniciar um projeto de Realidade Virtual na web, sobre um motor 3D em JavaScript.

---

## 1. Requisitos

| Item | Mínimo | Observação |
|---|---|---|
| Node.js | 20.19+ (22 LTS recomendado) | necessário só para o build/dev server |
| Gerenciador de pacotes | npm 10+ / pnpm 9+ | |
| Navegador de desenvolvimento | Chrome ou Edge 115+ | Firefox desktop **não** tem WebXR |
| Navegador de destino | Meta Quest Browser, Pico Browser, Safari (Vision Pro) | |
| Servidor | **HTTPS obrigatório** | exceto em `localhost` |
| Headset | opcional | dá para desenvolver 100% no emulador |

### A regra que quebra todo projeto iniciante

WebXR só funciona em **secure context**. Ou seja:

- `http://localhost` → funciona
- `http://192.168.0.10:5173` → **não funciona** (é o endereço que você usaria no headset)
- `https://192.168.0.10:5173` → funciona (com certificado auto-assinado aceito no headset)

Planeje HTTPS desde o primeiro dia, não no deploy.

---

## 2. Escolha do motor 3D

| Motor | Escolha quando | Custo |
|---|---|---|
| **Three.js** | padrão para a maioria dos casos; controle total, maior ecossistema | você escreve mais código de infraestrutura |
| **Babylon.js** | quer física, inspector e recursos WebXR já embutidos | bundle maior |
| **A-Frame** | protótipo rápido, autores não-programadores (HTML declarativo) | vira passivo em apps com estado complexo |
| **React Three Fiber** | o time já é React e há muito estado 2D↔3D compartilhado | overhead do reconciler no loop de frame |

O restante deste documento assume **Three.js**, mas os conceitos de WebXR (seção 5) valem para qualquer motor.

---

## 3. Dependências

**Runtime (mínimo absoluto):**

```bash
npm install three
```

**Desenvolvimento:**

```bash
npm install -D vite typescript @types/three @types/webxr @vitejs/plugin-basic-ssl
```

| Pacote | Por quê |
|---|---|
| `three` | motor 3D |
| `vite` | dev server com HMR e build de produção |
| `typescript` + `@types/three` | opcional, mas código XR é denso em matrizes e ciclos de vida |
| `@types/webxr` | tipos de `XRSession`, `XRFrame` etc. (não estão na lib DOM padrão) |
| `@vitejs/plugin-basic-ssl` | gera o certificado auto-assinado do HTTPS local |

**Opcional, para desenvolver sem headset:**

```bash
npm install -D iwer @iwer/devui
```

IWER (Immersive Web Emulation Runtime, da Meta) simula um Quest 3 e dá um painel na tela para mover cabeça e controles com mouse/teclado.

---

## 4. Estrutura mínima

```
projeto/
├── index.html          # canvas + <script type="module">
├── package.json
├── vite.config.js      # plugin de HTTPS + server.host
├── public/             # modelos, texturas, HDRIs (servidos como estão)
└── src/
    ├── main.js         # bootstrap
    ├── scene.js        # cena, luzes, conteúdo
    └── xr.js           # sessão, controles, locomoção
```

Não precisa de mais que isso para começar. Divida em camadas só quando a dor aparecer.

### `vite.config.js` mínimo

```js
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: { host: true, port: 5173 }, // host: true expõe na rede local
});
```

---

## 5. Os 5 conceitos obrigatórios de WebXR

Independentemente do motor, sem estes cinco pontos o projeto não funciona no headset.

### 5.1 Habilitar XR no renderer **antes do primeiro frame**

```js
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
```

Se ativar depois, o motor não troca a câmera pela `ArrayCamera` estéreo quando a sessão inicia.

### 5.2 Loop de render pelo compositor XR

```js
renderer.setAnimationLoop((time, xrFrame) => {
  renderer.render(scene, camera);
});
```

**Nunca use `requestAnimationFrame`.** Dentro da sessão os frames são agendados pelo dispositivo, não pela página. É também o único caminho para receber o `XRFrame`, necessário para hit-test, anchors e poses de mão.

### 5.3 Reference space

Define onde fica a origem (0,0,0):

| Tipo | Origem | Uso |
|---|---|---|
| `local-floor` | chão físico do usuário | **padrão para VR room-scale** |
| `local` | posição da cabeça ao iniciar | dispositivos 3DoF |
| `bounded-floor` | chão + limites da área desenhada | quando precisa da geometria do guardian |
| `viewer` | a própria cabeça | raycast, UI presa à visão |

### 5.4 Requisição de sessão

```js
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['bounded-floor', 'hand-tracking', 'layers'],
});
await renderer.xr.setSession(session);
```

**Peça o mínimo possível como `requiredFeatures`.** Uma feature obrigatória que o runtime não implementa rejeita a sessão inteira — é a causa nº 1 do "botão Enter VR não faz nada".

Antes de mostrar o botão, verifique o suporte:

```js
const ok = await navigator.xr?.isSessionSupported('immersive-vr');
```

E lembre: a sessão precisa ser iniciada por **gesto do usuário** (clique/tap), nunca no carregamento da página.

### 5.5 Player rig — nunca mova a câmera

```js
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

// locomoção move o rig:
rig.position.set(x, rig.position.y, z);
```

O `renderer.xr` sobrescreve a transform da câmera com a pose rastreada da cabeça a cada frame. Mover a câmera diretamente causa dessincronia, drift e enjoo.

---

## 6. Entrada (controles e mãos)

O motor expõe três espaços distintos por controle:

```js
const controller = renderer.xr.getController(0);      // targetRaySpace — de onde sai o raio de mira
const grip = renderer.xr.getControllerGrip(0);        // gripSpace — onde encaixa o modelo 3D do controle
const hand = renderer.xr.getHand(0);                  // juntas, quando há hand tracking
```

Eventos disponíveis: `connected`, `disconnected`, `selectstart`, `selectend`, `squeezestart`, `squeezeend`.

Analógicos ficam em `inputSource.gamepad.axes` — no mapeamento `xr-standard`, os índices `[2]` e `[3]` são o thumbstick (`[0]` e `[1]` são o touchpad).

---

## 7. Conforto — decisões de design, não de código

Enjoo em VR não é bug de performance; é decisão de design. O mínimo aceitável:

- **Teleporte como locomoção padrão.** Movimento contínuo é o principal gatilho de enjoo.
- **Snap turn (30–45° discretos)**, não rotação suave.
- **Nenhuma aceleração ou movimento de câmera forçado** pelo sistema.
- **Frame rate estável.** Quest 2 a 72 Hz = 13,8 ms por frame **para os dois olhos**. Frame perdido vira reprojeção, que o sistema vestibular lê como o mundo deslizando.

Orçamento inicial: < 100–150 draw calls, < 500 mil triângulos por frame, `pixelRatio` limitado a 1.5, no máximo 1 luz direcional com sombra em tempo real.

---

## 8. Como testar

| Cenário | Como |
|---|---|
| Sem headset | `iwer` + `@iwer/devui` no modo dev |
| Headset via USB (mais confiável) | `adb reverse tcp:5173 tcp:5173` e abrir `https://localhost:5173` dentro do headset |
| Headset via Wi-Fi | `vite --host` e abrir `https://<ip-da-máquina>:5173`, aceitando o certificado |
| Debug remoto | `chrome://inspect` com o headset em modo desenvolvedor |

---

## 9. Deploy

O único requisito real é **HTTPS**. Como é um site estático (`dist/`), qualquer um serve:

- GitHub Pages, Netlify, Vercel, Cloudflare Pages — HTTPS automático, sem configuração
- Nginx/S3+CloudFront — TLS terminado no ingress/CDN

Cabeçalho recomendado: `Permissions-Policy: xr-spatial-tracking=(self)` para restringir quais origens (inclusive iframes) podem pedir rastreamento.

---

## 10. Checklist de início

- [ ] Node 20.19+ instalado
- [ ] `npm install three` + devDeps da seção 3
- [ ] Vite configurado com HTTPS (`basicSsl`) e `host: true`
- [ ] `renderer.xr.enabled = true` antes do primeiro frame
- [ ] `renderer.setAnimationLoop`, não `requestAnimationFrame`
- [ ] `isSessionSupported()` antes de exibir o botão
- [ ] Sessão iniciada por clique do usuário
- [ ] `local-floor` como única `requiredFeature`
- [ ] Câmera dentro de um rig; locomoção move o rig
- [ ] Fallback 2D claro para navegadores sem WebXR
- [ ] Teleporte e snap turn como padrão
- [ ] Testado em pelo menos um headset físico

---

## Referências

- W3C — WebXR Device API Level 1: <https://www.w3.org/TR/webxr/>
- Three.js — manual de WebXR: <https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content>
- MDN — WebXR Device API: <https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API>
- IWER (emulador): <https://github.com/meta-quest/immersive-web-emulation-runtime>
- Meta — diretrizes de performance para o Quest Browser
