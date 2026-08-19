import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupXR } from './xr.js';

import {
    probeCapabilities,
    probeActiveSession,
    startCapabilitySession
} from './capabilities/probe.js';


async function start() {

    console.log('Iniciando WebXR...');


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

    console.log(
        'Executando sonda de capacidades...'
    );

    const capabilities =
        await probeCapabilities();


    console.log(
        '=== Capacidades estáticas ==='
    );

    console.log(capabilities);


    // =============================================
    // Sessão de diagnóstico
    // =============================================
    //
    // IMPORTANTE:
    // A sessão só será iniciada depois que o
    // usuário clicar no botão.
    // =============================================

    if (
        capabilities.sessions.inline.supported
    ) {

        const button =
            document.createElement('button');

        button.textContent =
            'Testar capacidades da sessão WebXR';

        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';

        button.style.padding = '12px 18px';
        button.style.border = 'none';
        button.style.borderRadius = '8px';

        button.style.cursor = 'pointer';

        document.body.appendChild(button);


        button.addEventListener(
            'click',
            async () => {

                button.disabled = true;

                button.textContent =
                    'Testando...';


                try {

                    console.log(
                        'Iniciando sessão inline para diagnóstico...'
                    );


                    const session =
                        await startCapabilitySession(
                            'inline'
                        );


                    // -------------------------------------
                    // Consulta da sessão
                    // -------------------------------------

                    const sessionCapabilities =
                        await probeActiveSession(
                            session,
                            'inline'
                        );


                    console.log(
                        '=== Capacidades da sessão ==='
                    );

                    console.log(
                        sessionCapabilities
                    );


                    // -------------------------------------
                    // Encerramento
                    // -------------------------------------

                    await session.end();


                    console.log(
                        'Sessão de diagnóstico encerrada.'
                    );


                } catch (error) {

                    console.error(
                        'Não foi possível iniciar a sessão:',
                        error
                    );


                } finally {

                    button.disabled = false;

                    button.textContent =
                        'Testar novamente';

                }

            }
        );

    } else {

        console.log(
            'Sessão inline não suportada.'
        );

    }


    // =============================================
    // Loop de renderização
    // =============================================

    function animate() {

        renderer.render(
            scene,
            camera
        );

    }


    renderer.setAnimationLoop(
        animate
    );

}


// =============================================
// Inicialização
// =============================================

start();