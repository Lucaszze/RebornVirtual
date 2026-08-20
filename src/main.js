import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupXR } from './xr.js';

import {
    probeCapabilities,
    probeActiveSession,
    startCapabilitySession
} from './capabilities/probe.js';

import {
    log,
    explicarErro,
    renderCapabilities,
    renderSessionCapabilities
} from './relatorio.js';


// =============================================
// Elementos onde o relatório é escrito.
// Existem no index.html — ver <div id="...">.
// =============================================

const diarioEl = document.getElementById('diario');
const relatorioEl = document.getElementById('relatorio');
const sessaoEl = document.getElementById('sessao');


async function start() {

    log(diarioEl, 'Iniciando WebXR...');


    // =============================================
    // Criação da estrutura base
    // =============================================

    const scene = createScene();

    const camera = createCamera();

    const renderer = createRenderer();

    setupXR(renderer);


    // =============================================
    // Sonda de capacidades
    // =============================================

    log(diarioEl, 'Executando sonda de capacidades...');

    const capabilities = await probeCapabilities();

    // Antes só ia pro console. Agora, para além do console (que
    // continua ativo por causa de log(), lá em relatorio.js), o
    // resultado aparece escrito na própria página.
    renderCapabilities(relatorioEl, capabilities);


    // =============================================
    // Sessão de diagnóstico
    // =============================================
    //
    // IMPORTANTE:
    // A sessão só será iniciada depois que o
    // usuário clicar no botão.
    // =============================================

    if (capabilities.sessions.inline.supported) {

        const button = document.createElement('button');

        button.textContent =
            'Testar capacidades da sessão WebXR';

        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';

        button.style.padding = '16px 24px';
        button.style.fontSize = '18px';
        button.style.border = 'none';
        button.style.borderRadius = '8px';

        button.style.cursor = 'pointer';

        document.body.appendChild(button);


        // O teste só pode acontecer uma vez: depois do primeiro clique,
        // o botão fica desabilitado e não volta a ficar clicável — não
        // existe reset para "Testar novamente".
        button.addEventListener('click', async () => {

            button.disabled = true;
            button.textContent = 'Testando...';

            try {

                log(diarioEl, 'Iniciando sessão inline para diagnóstico...');

                const session = await startCapabilitySession('inline');

                const sessionCapabilities =
                    await probeActiveSession(session, 'inline');

                renderSessionCapabilities(sessaoEl, sessionCapabilities);

                await session.end();

                log(diarioEl, 'Sessão de diagnóstico encerrada.');

                button.textContent = 'Teste concluído';

            } catch (error) {

                // A falha é resultado, não bug — e precisa ser lida no
                // próprio aparelho, porque quem está de visor não tem
                // como abrir o console para ver o erro cru.
                log(diarioEl, explicarErro(error), 'erro');

                button.textContent = 'Teste falhou';

            }

            // Sem "finally" reabilitando o botão: uma vez clicado, ele
            // permanece desabilitado, sucesso ou falha.

        }, { once: true });

    } else {

        log(diarioEl, 'Sessão inline não suportada.', 'alerta');

    }


    // =============================================
    // Loop de renderização
    // =============================================

    function animate() {
        renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

}


// =============================================
// Inicialização
// =============================================

start();