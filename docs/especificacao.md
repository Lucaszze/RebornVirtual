# Especificação do projeto RebornVirtual: montagem de um computador

Este arquivo fica em `docs/especificacao.md` e muda junto com o código. As quatorze seções seguem a ordem e os títulos pedidos pela disciplina.

## Bloco A. A cena

### Seção 1. Identificação do grupo e da cena

Grupo: RebornVirtual.
Integrantes: Vinicius Santarelli, Lucas Zurano, Mateus Zurano, Luan, Raul.
Cena escolhida: montagem de um computador.

O ambiente em uma frase: uma bancada onde seis peças de computador precisam encontrar, cada uma, o seu único lugar e o seu único sentido dentro de um gabinete aberto.

Escolhemos esta cena porque o chaveamento aqui é físico. O entalhe do pente, o suporte do dissipador e o nicho da fonte já recusam sozinhos a peça errada e o sentido errado, coisa que as outras cenas teriam de inventar. Em troca, aceitamos um custo: modelos fiéis o bastante para que lugar e sentido sejam legíveis a olho, e um encaixe que julga posição, ângulo e ordem ao mesmo tempo. Esse custo cai justamente sobre a etapa de manipulação, que é a parte mais pesada do trabalho.

A armadilha desta cena é virar uma sequência guiada de cliques: se em cada instante existe uma única peça válida e o próprio ambiente aponta qual é, não há interação, há sequência de cliques. Nossa resposta é a Regra de Ouro do projeto: o ambiente não dá dica nem passo a passo de como montar o computador. Todas as peças ficam disponíveis desde o início, algumas viradas ao contrário; os caminhos inúteis são permitidos; as recusas dizem a categoria do erro e nunca a solução; nenhum realce indica qual peça pegar em seguida. A montagem precisa admitir caminhos inúteis para que o caminho certo signifique alguma coisa.

### Seção 2. O que a pessoa faz ali

A pessoa chega a uma bancada de oficina. Sobre ela há um gabinete de computador deitado e aberto, vazio por dentro, e seis peças espalhadas ao redor: uma placa grande cheia de circuitos, dois pentes compridos e finos, um bloco com aletas, uma caixa de metal com ventoinha e uma plaquinha pequena. Algumas estão viradas ao contrário. Ninguém diz por onde começar.

Ela pega uma peça, vira nas mãos, aproxima de um lugar dentro do gabinete e solta. Às vezes a peça assenta com um estalo e trava. Às vezes a bancada recusa, e recusa de três jeitos diferentes: aquele lugar não é daquela peça; a peça é a certa, mas está virada ao contrário e o entalhe não coincide; ou ainda não é a vez daquela peça, porque falta algo antes. A pessoa tenta, erra, gira, troca de peça e vai fechando o conjunto por conta própria. Quando a sexta peça trava, o gabinete responde: a ventoinha gira, uma luz acende e toca um acorde curto. O computador ligou, e ninguém precisou dizer como.

O que se faz com as mãos: pega-se cada peça, gira-se no pulso até achar o sentido, encosta-se no lugar e solta-se. Quem decide se encaixou é o ambiente, no momento de soltar.

O que muda com o visor: a bancada ganha tamanho de bancada e profundidade de verdade. Dá para contornar a peça com a cabeça e conferir o entalhe a olho, coisa que a tela achata.

O que a câmera precisa provar contra uma mesa de verdade: que o gabinete fica parado no mesmo canto da mesa real enquanto a pessoa anda ao redor com o celular. Uma figura que só acompanha a tela não passa nesse teste.

### Seção 3. Inventário de objetos

| Objeto | Quantos | Origem | Move? | Observação |
|---|---|---|---|---|
| Bancada | 1 | construída por código | não | apoio fixo da cena; 1,60 × 0,80 m |
| Gabinete aberto | 1 | modelo importado (glTF) | não | deitado, tampa removida, fixo sobre a bancada |
| Placa-mãe | 1 | modelo importado (glTF) | sim, apanhada pela pessoa | base dos demais encaixes; primeira da ordem |
| Pente de memória | 2 | construído por código | sim, apanhado pela pessoa | idênticos; o entalhe assimétrico precisa sair exato |
| Dissipador | 1 | modelo importado (glTF) | sim, apanhado pela pessoa | só encaixa depois dos dois pentes |
| Fonte | 1 | modelo importado (glTF) | sim, apanhada pela pessoa | sentido único: ventoinha voltada para a grade |
| SSD (M.2) | 1 | construído por código | sim, apanhado pela pessoa | menor peça da cena; entalhe no conector |
| Painel de mensagens | 1 | construído por código | não | placa fixa atrás da bancada onde as recusas aparecem em letra grande |
| Ambiente (chão + parede) | 1 | construído por código | não | mínimo; é o primeiro a sair na degradação |

Total: 9 tipos e 10 objetos em cena (o pente repete). A cena tem poucos objetos de propósito. O esforço do projeto está na precisão do encaixe, não na quantidade.

A mistura de origens é proposital e atende ao que a disciplina cobra. Os quatro modelos de forma complexa (gabinete, placa-mãe, dissipador e fonte) vêm importados de arquivos de terceiros. Bancada, painel, ambiente, pentes e SSD são construídos por código. Pentes e SSD ficaram no grupo do código de propósito: o entalhe deles é regra de jogo e precisa sair geometricamente exato.

### Seção 4. O espaço e as escalas

Todos os números em unidades do mundo (1 unidade = 1 metro).

- Espaço livre necessário na sala para o regime de visor, em pé: 2,0 × 2,0 m.
- Bancada: 1,60 m de largura, 0,80 m de profundidade, tampo a 0,95 m do chão. A cena fica apoiada sobre a bancada e a pessoa fica de pé diante dela.
- Gabinete deitado e aberto: 0,46 × 0,45 × 0,21 m.
- Placa-mãe (padrão ATX): 30,5 × 24,4 cm.
- Pente de memória: 13,3 × 3,1 × 0,8 cm.
- Dissipador: 12 × 10 × 8 cm.
- Fonte: 15 × 14 × 8,6 cm.
- SSD M.2 (2280): 8,0 × 2,2 cm.
- Zona de alcance: peças e encaixes ficam a no máximo 0,60 m do centro da bancada, dentro do braço de uma pessoa parada.

A cena tem duas escalas legítimas, e a decisão fica registrada desde já. Na tela e no visor ela é 1:1, em tamanho real. Pela câmera do celular a escala padrão é 1:2 (a bancada vira 80 × 40 cm ancorada sobre a mesa verdadeira, para caber em mesas comuns), com opção de 1:1 quando a superfície detectada comportar. Essa decisão muda o alcance, a precisão do toque e as folgas da Seção 7, que ganham um multiplicador no regime de câmera.

## Bloco B. As regras

### Seção 5. As ações do usuário

Nenhuma ação de menu. Tudo acontece sobre os objetos da cena.

| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
|---|---|---|---|
| Apontar | mira uma peça (raio do controle, do mouse, ou toque) | a peça mirada ganha contorno claro | nada realça; peça já travada não realça |
| Apanhar | aciona sobre a peça mirada | a peça passa a acompanhar a mão; uma marca fantasma fica no seu lugar de origem na bancada | painel avisa "Esta peça já está travada no lugar." e toca um som seco |
| Girar | gira o pulso (visor), tecla ou roda (tela), dois dedos em passos de 90° (câmera) | a peça gira junto | peça travada não gira |
| Encaixar | aproxima a peça de um lugar e solta | dentro da folga e das regras: assenta com estalo e trava | recusa e diz o motivo (três recusas distintas, listadas abaixo) |
| Soltar fora de encaixe | solta a peça longe de qualquer lugar | a peça pousa na bancada; fora da zona útil, volta ao ponto de origem em 2 s | não se aplica |

As três recusas do encaixe, cada uma com mensagem e som próprios, sempre no painel fixo e em letra grande:

1. Peça errada: "Este lugar não é desta peça."
2. Orientação errada: "Peça certa, sentido errado: o entalhe não coincide."
3. Ordem errada: "Ainda não é a vez desta peça: falta algo antes."

Pela Regra de Ouro, a mensagem diz a categoria da recusa e para por aí. Ela nunca informa qual peça é a certa, qual é o sentido correto nem o que falta antes. Assim o ambiente consegue dizer "não pode" de três jeitos legíveis sem virar tutor.

### Seção 6. A tarefa e sua validação

Estado inicial: gabinete aberto, vazio e fixo sobre a bancada; as seis peças móveis espalhadas ao redor dele, em posições variadas e algumas viradas ao contrário de propósito.

Estado final que conta como sucesso: as seis peças no estado travada, cada uma no seu único lugar e sentido. Ao travar a sexta, o gabinete liga (ventoinha, luz e acorde).

A ordem é parcialmente rígida. As precedências:

1. A placa-mãe entra antes de qualquer peça presa a ela: pentes, SSD e dissipador só travam com a placa já travada no gabinete.
2. Os dois pentes entram antes do dissipador, porque o corpo do dissipador cobre o acesso aos encaixes dos pentes. A regra vem da montagem real.
3. A fonte é livre e pode travar em qualquer momento.

Fora dessas precedências, qualquer caminho vale, inclusive os inúteis: pegar a peça errada, tentar o lugar errado, girar sem necessidade. Eles existem de propósito, como a Seção 1 explica.

Como o sistema sabe que houve sucesso: cada lugar de encaixe guarda o identificador da única peça que aceita e um estado (vazio ou travado). O travamento só acontece quando, no instante de soltar, as três condições valem ao mesmo tempo: (a) o identificador da peça confere com o do lugar; (b) posição e ângulo estão dentro das folgas da Seção 7; (c) as precedências acima estão satisfeitas. O sucesso é declarado quando a contagem de lugares travados chega a 6. Como toda travagem exigiu as três condições, o estado final garante que o percurso foi válido, sem nenhuma verificação vaga no fim.

### Seção 7. Regras de encaixe e tolerâncias

Os valores abaixo são provisórios e existem para que haja o que testar no aparelho. A verificação acontece no instante de soltar, nunca de forma contínua, para a peça não saltar da mão.

| Encaixe | Folga de posição | Folga de ângulo | Observação |
|---|---|---|---|
| Placa-mãe no gabinete | 5 cm | 20° | peça grande, alvo grande, folga generosa |
| Pente no encaixe da placa | 3 cm | 15° | pente virado 180° não é erro de ângulo: é recusa de orientação |
| SSD no conector | 2,5 cm | 15° | menor alvo da cena; vale a mesma regra para o giro de 180° |
| Dissipador sobre o soquete | 4 cm | 20° | uma única orientação válida, dada pela trava do suporte |
| Fonte no nicho | 5 cm | 20° | invertida (ventoinha para dentro) é recusa de orientação |

No regime de câmera todas as folgas são multiplicadas por 1,5, porque o toque na tela é menos preciso que a mão com controle.

O raciocínio fica registrado. Folga grande demais faz a peça pular sozinha para o lugar, e a montagem deixa de existir. Folga pequena demais transforma o encaixe numa tortura de precisão que o rastreamento não sustenta. O intervalo entre esses dois defeitos é estreito, e o plano para encontrá-lo é partir dos valores acima, testar com 3 pessoas por regime no Bloco 5 e registrar nesta seção cada valor tentado e o sintoma observado (salta sozinho, tortura ou confortável). O histórico dos testes vale tanto quanto o valor final.

### Seção 8. Retorno ao usuário

O retorno entra junto com cada ação, e não no fim do projeto. Nenhuma informação essencial existe só como cor: toda situação combina cor com som ou com movimento. Texto pequeno flutuando não aparece em nenhum regime.

| Situação | O que o ambiente devolve |
|---|---|
| Peça mirada | contorno claro na peça, neutro, sem verde ou vermelho de certo e errado |
| Peça apanhada | a peça segue a mão; vibração curta no controle (visor); uma marca fantasma fica no lugar de origem na bancada |
| Perto de um lugar de encaixe (até 10 cm) | aparece uma silhueta translúcida do assento, para qualquer lugar próximo, esteja a peça certa na mão ou não; ela avisa que ali existe um encaixe ao alcance, e o veredito só sai ao soltar (é assim que o retorno convive com a Regra de Ouro) |
| Encaixe aceito | estalo curto, a peça assenta com uma pequena animação de acomodação e o lugar acende por 1 s |
| Encaixe recusado | som de recusa (um por categoria), a peça permanece na mão e a mensagem da categoria aparece no painel fixo, em letra grande |
| Tarefa concluída | a ventoinha do gabinete gira, a luz interna acende e toca um acorde curto de inicialização; a resposta vem da própria máquina, sem aviso por cima da cena |

## Bloco C. A máquina

### Seção 9. Os três regimes

| Aspecto | Na tela | No visor | Pela câmera |
|---|---|---|---|
| Como se olha | câmera orbital com o mouse ao redor da bancada | movendo a cabeça, de pé diante da bancada | movendo o próprio aparelho ao redor da cena ancorada na mesa |
| Como se aponta e age | raio do mouse; clique segura e solta; roda ou tecla gira | raio do controle e toque direto; gatilho segura e solta; o pulso gira a peça | toque seleciona; arrastar move a peça no plano da mesa; dois dedos giram em passos de 90° |
| Escala da cena | 1:1, vista por uma janela | 1:1, tampo da bancada a 0,95 m | 1:2 por padrão, ancorada numa mesa real (1:1 opcional se a mesa comportar) |
| O que a cena faz de diferente | é o caso base: roda em qualquer máquina, sem equipamento, e é onde as regras nascem e são testadas | profundidade real e giro de pulso: alinhar o entalhe a olho e com as mãos | ancora a bancada no mundo verdadeiro e prova que ela fica parada enquanto a pessoa anda ao redor |
| O que não existe neste regime | visão em profundidade, escala corporal, vibração | o mundo real ao redor (a sala é virtual); reposicionar a cena | agarrar com a mão e vibração; giro fino (só passos de 90°); visão em profundidade |

O regime de tela garante que o trabalho avance mesmo quando o visor está com outro grupo. Por isso os Blocos 3 e 4 do plano acontecem inteiramente nele.

### Seção 10. Orçamento e desempenho

- Objetos em cena: 10, de 9 tipos. A única repetição é o pente, e é repetição barata: os dois compartilham geometria e material, uma malha só na memória.
- Meta de fluidez: 72 quadros por segundo no visor (tempo de quadro de até 13,9 ms), porque travamento dentro do visor causa mal-estar físico, e 60 qps na tela e pela câmera.
- Orçamento de geometria: até 150 mil triângulos na cena inteira. Cada modelo importado entra com até 30 mil triângulos; acima disso é simplificado ou trocado antes de entrar.
- Chamadas de desenho: até 50. Texturas: até 2048 × 2048, e até 1024 nas peças pequenas.

A ordem de degradação fica decidida agora, com calma, e não depois, com a cena travando:

1. Saem as sombras dinâmicas; ficam sombras fixas simples sob as peças.
2. As texturas caem de 2048 para 1024.
3. Sai o ambiente (parede e chão decorativos); ficam bancada, gabinete e peças.
4. Os modelos importados são simplificados, sempre preservando a silhueta e os entalhes. O entalhe é regra de jogo, não enfeite, e não sai em nenhum nível de degradação.

### Seção 11. Erros, limites e degradação

As quatro situações certas, com a resposta de cada uma:

1. O aparelho não suporta o regime pedido. A sonda de capacidades (Tarefa 2, já implementada no repositório) roda quando a página abre e escreve o resultado na própria tela. Os botões de visor e de câmera só aparecem habilitados quando o navegador confirma o suporte; sem suporte, o botão fica desabilitado com o motivo escrito ao lado. A sonda também distingue "sem suporte do aparelho" de "página fora de conexão segura (https)". O regime de tela existe sempre, então nada abre em branco.
2. A permissão de câmera é negada. O pedido de sessão falha, o painel explica em português que a câmera foi recusada e como reautorizá-la nas permissões do navegador, e o botão volta ao estado inicial para nova tentativa. A cena continua disponível no regime de tela. A tradução dos erros de segurança para frases legíveis já existe no módulo de relatório do repositório.
3. O rastreamento se perde, por exemplo com a câmera apontada para uma parede lisa ou uma mesa reflexiva. A bancada ancorada congela na última posição conhecida, sem sumir e sem derivar, e o painel avisa: "Rastreamento perdido. Aponte a câmera de volta para a mesa." A peça que estava na mão continua na mão. Quando o rastreamento volta, a âncora retoma sozinha; se não voltar em 15 segundos, o ambiente oferece reposicionar a cena com um toque.
4. A pessoa sai do espaço útil ou tenta alcançar algo fora do braço. Por desenho, tudo fica a até 0,60 m do centro da bancada, então não existe alvo fora do alcance. Peça solta a mais de 1,2 m da bancada esmaece e volta ao seu ponto de origem em 2 segundos, e nada se perde no chão virtual. No visor, ao cruzar o limite da área demarcada, aparece a grade de segurança do próprio aparelho e o ambiente suspende o apanhar até a pessoa voltar.

## Bloco D. O trabalho

### Seção 12. Ativos, formatos e licenças

Regra do grupo: nenhum ativo entra no repositório sem a linha desta tabela preenchida (arquivo, origem, licença e endereço), no mesmo commit que o adiciona. "Achado na internet" não conta como origem.

| Arquivo | Origem | Licença | Endereço |
|---|---|---|---|
| `bancada`, `painel`, `ambiente` (geometria por código) | construídos pelo grupo em Three.js | a do repositório | não se aplica |
| `pente-memoria`, `ssd-m2` (geometria por código, entalhe exato) | construídos pelo grupo em Three.js | a do repositório | não se aplica |
| `gabinete.glb` | Sketchfab, busca com filtro de licença | exigida: CC0 ou CC-BY, com atribuição registrada aqui | a preencher na escolha, no Bloco 2 |
| `placa-mae.glb` | Sketchfab, busca com filtro de licença | exigida: CC0 ou CC-BY | a preencher na escolha, no Bloco 2 |
| `dissipador.glb` | Sketchfab, busca com filtro de licença | exigida: CC0 ou CC-BY | a preencher na escolha, no Bloco 2 |
| `fonte.glb` | Sketchfab, busca com filtro de licença | exigida: CC0 ou CC-BY | a preencher na escolha, no Bloco 2 |
| Sons de interface (estalo, três recusas, acorde de ligar) | pacotes de áudio da Kenney (kenney.nl) | CC0 | pacote exato a fixar no Bloco 2 |

Os modelos importados entram em glTF/GLB, o formato nativo do carregador do Three.js.

Sobre o caso frequente que a disciplina nomeia: nenhum objeto de demonstração que acompanha ferramenta ou biblioteca será publicado como cena própria. O uso até seria permitido, mas não contaria como composição de cena. Aqui a composição vem dos quatro modelos importados da tabela mais os objetos construídos por código.

Os endereços pendentes são decisão em aberto, declarada na Seção 14 com prazo: fecham no Bloco 2, antes de qualquer ativo entrar no repositório.

### Seção 13. Plano de construção por blocos

Cada linha diz o que estará funcionando ao fim do bloco, e não o que estará em andamento. Em qualquer ponto do percurso existe algo que abre e responde.

| Bloco | Ao fim dele, roda: |
|---|---|
| 1 (entregue) | sonda de capacidades: a página abre em qualquer navegador, relata as capacidades do aparelho e executa a sessão de diagnóstico. É o estado atual do repositório (Tarefa 2) |
| 2 | cena estática nos três regimes: bancada, gabinete e as seis peças visíveis e corretamente dimensionadas na tela (câmera orbital), no visor (1:1) e ancoradas numa mesa real pela câmera (1:2); tabela de ativos da Seção 12 com endereços e licenças preenchidos |
| 3 | manipulação na tela: apontar, apanhar, girar e soltar funcionam com o mouse; o encaixe dos dois pentes funciona de ponta a ponta, com as três recusas e o painel de mensagens respondendo |
| 4 | tarefa completa na tela: as seis peças encaixam, a ordem parcial é imposta, a validação declara o sucesso e a máquina liga; sons no lugar |
| 5 | regimes imersivos: a mesma tarefa completa no visor (controles) e pela câmera (toque, giro de 90°); folgas medidas e ajustadas no aparelho com o protocolo da Seção 7; as quatro situações da Seção 11 respondem como está escrito |
| 6 | orçamento e fechamento: 72 qps confirmados no visor com a cena completa, degradação aplicada se necessário; releitura da Seção 2 contra o que existe, para conferir se o grupo construiu o que prometeu |

### Seção 14. Riscos, decisões em aberto e declarações

Riscos, com resposta e prazo:

| O que preocupa | O que será feito | Quando |
|---|---|---|
| As folgas caírem em "salta sozinho" ou em "tortura de precisão" | protocolo da Seção 7: 3 pessoas por regime, com registro de cada valor tentado e do sintoma | Bloco 5 |
| Modelos importados estourarem o orçamento de geometria | limite de 30 mil triângulos conferido na entrada; simplificar ou trocar antes de commitar | Bloco 2 |
| O visor ser compartilhado entre os grupos e virar gargalo | a tela é o caso base e toda regra nasce e fecha nela (Blocos 3 e 4); as sessões de visor ficam agendadas em lote | Blocos 2 a 5 |
| Âncora instável em mesa lisa ou reflexiva no regime de câmera | testar em 3 mesas diferentes; se falhar, oferecer posicionamento manual por toque | Bloco 5 |
| A Regra de Ouro frustrar demais quem nunca viu um computador aberto | medir no teste o tempo até a primeira peça travada; acima de 3 minutos, melhorar a redação das recusas, nunca adicionar dica | Bloco 5 |

Decisões em aberto, e como cada uma será tomada:

- Valores finais das folgas de posição e ângulo: saem de medição, pelo protocolo da Seção 7 (Bloco 5).
- Escala padrão pela câmera, 1:2 ou 1:1: sai de teste em mesas reais de tamanhos comuns (Bloco 5).
- Dissipador com uma ou duas orientações válidas: o grupo confere o suporte do componente real de referência antes de codificar a regra (até o Bloco 3).
- Endereço e licença finais dos quatro modelos importados: pesquisa com filtro de licença, fechada no Bloco 2, antes do primeiro commit de ativo.

Declaração de uso de inteligência artificial: a estrutura e a primeira redação desta especificação foram feitas com apoio de IA (Claude), a partir de dois insumos escritos pelo grupo, as regras da cena escolhida e o texto-guia da disciplina. O assistente também leu o repositório do grupo, para que o plano partisse do código que já existe (a sonda de capacidades citada nas Seções 11 e 13). Antes de considerar o documento fechado, o grupo confere as medidas da Seção 4 contra as dimensões reais dos componentes (padrões ATX, DDR4 e M.2 2280), as precedências da Seção 6 contra a prática real de montagem e os números da Seção 10 contra o aparelho disponível. Cada integrante revisa e assina ao menos uma seção em commit próprio; nenhuma linha permanece aqui sem que alguém do grupo saiba explicá-la.

Revisões, uma por integrante, registrada em commit próprio:

- [ ] Vinicius Santarelli: Seções __
- [ ] Lucas Zurano: Seções __
- [ ] Mateus Zurano: Seções __
- [ ] Luan: Seções __
- [ ] Raul: Seções __
