# RebornVirtual

Montagem de um computador em realidade virtual/aumentada, para a disciplina de
Realidade Virtual. A especificação completa do projeto está em
[`docs/especificacao.md`](docs/especificacao.md).

A ideia: uma bancada com um gabinete aberto e seis peças, que precisam encontrar
cada uma o seu único lugar e sentido. A mesma cena roda em três regimes — **na
tela** (câmera em órbita), **no visor** (WebXR imersivo) e **pela câmera** (AR,
com a bancada ancorada numa mesa real).

## Tecnologia

- **Vite** + **TypeScript** (strict)
- **Three.js** + **WebXR**

## Desenvolvimento

Instalar dependências:

```bash
npm install
```

Executar o servidor (com HTTPS autoassinado, exigido pelo WebXR):

```bash
npm run dev
```

O `--host` deixa a mesma URL acessível na rede local — abra-a no desktop, no
celular e no visor para comparar os três regimes. Aceite o certificado
autoassinado no primeiro acesso.

Conferir os tipos / gerar o build de produção:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + vite build
```

## Estrutura do código

```
src/
  main.ts             orquestra tudo: cena, sonda, regimes, botões de sessão
  regimes/
    regimes.ts        declaração formal dos três regimes (Seção 9)
    verificacao.ts    suporte de cada regime: sim / não / desconhecido
  sonda/
    sonda.ts          a sonda de capacidades (Bloco 1)
    recursos.ts       recursos opcionais: concedido / negado / indeterminado
    graus.ts          graus de liberdade e classe do aparelho
    estabilidade.ts   contador de perda de rastreamento
  relatorio/
    relatorio.ts      as folhas do relatório (regimes + sonda)
    diario.ts         o "Painel de mensagens" (Seção 3) e a tradução de erros
    comum.ts          células e parágrafos compartilhados
  cena/
    oficina.ts        a cena: bancada, gabinete, ambiente, luzes, câmera
    pecas.ts          as seis peças, com as dimensões da Seção 4
  xr/
    controles.ts      apontar / apanhar / soltar no visor
    ar.ts             hit-test e ancoragem da bancada na mesa real
    contexto.ts       estado compartilhado (regime ativo, bancada pousada)
```

## Onde estamos no plano

- **Bloco 1 (entregue):** sonda de capacidades — a página relata o que o
  aparelho concede.
- **Bloco 2 (em andamento):** cena estática nos três regimes — bancada, gabinete
  e as seis peças, em escala real, visíveis na tela, no visor e ancoradas por AR.

Os quatro modelos de forma complexa (gabinete, placa-mãe, dissipador, fonte)
entram como caixas dimensionadas corretamente, porque o Módulo 03 pede geometria
crua construída por código; serão trocados por glTF importado no módulo de ativos
externos (decisão registrada na Seção 14 da especificação).

## Aparelhos testados

Em que aparelhos o ambiente já foi visto funcionando, conforme o relatório da
própria página (a sonda de capacidades). Quem testar em outro aparelho acrescenta
uma linha.

| Aparelho | Regime que abriu | O que não abriu |
|---|---|---|
| PC Dell Inspiron 15 3520 (i5-1135G7, Iris Xe), Windows 11, Brave | Na tela: cena, manipulação, encaixe e painel de custo (120 qps, 8,3 ms, 220 triângulos) | No visor e pela câmera: o aparelho não declara sessão imersiva |
| Celular Android, Chrome, aberto pelo túnel HTTPS | Na tela, e a sessão pela câmera (composição alpha-blend confirmada; local-floor, unbounded, hit-test, anchors e plane-detection concedidos) | bounded-floor, dom-overlay e hand-tracking não concedidos; a sonda classificou o celular como visor, erro conhecido em `src/sonda/graus.ts` |

Medições de desempenho, com máquina e data: Seção 10 da especificação.
