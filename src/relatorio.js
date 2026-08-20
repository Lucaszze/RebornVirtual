// src/relatorio.js
// ---------------------------------------------------------------------------
// Escreve o resultado da sonda na própria página.
//
// Por quê: quem está com o headset no rosto não abre o console de
// depuração. Se o relatório só existir em console.log(), ele existe
// apenas para quem escreveu o código, sentado no computador. Este
// módulo pega o que já era calculado em probe.js e escreve em texto
// simples dentro de elementos da página, para ser lido no próprio
// aparelho.
//
// Continuamos espelhando tudo no console também — não custa nada e
// ajuda quando o aparelho está ligado por depuração remota.
// ---------------------------------------------------------------------------

function linha(texto) {
    const p = document.createElement('p');
    p.textContent = texto;
    return p;
}

function titulo(texto, nivel = 'h2') {
    const h = document.createElement(nivel);
    h.textContent = texto;
    return h;
}

/**
 * Registra uma mensagem de status (o "diário" da sondagem) tanto no
 * console quanto num elemento da página.
 *
 * tipo pode ser 'info', 'alerta' ou 'erro' — só muda a cor, para dar
 * destaque visual sem precisar de mais nada.
 */
export function log(container, mensagem, tipo = 'info') {
    console.log(mensagem);

    const item = linha(mensagem);
    item.style.margin = '4px 0';
    item.style.fontFamily = 'monospace';

    if (tipo === 'erro') {
        item.style.color = '#c0392b';
    } else if (tipo === 'alerta') {
        item.style.color = '#d35400';
    }

    container.appendChild(item);
}

/**
 * Traduz o erro cru (nome de classe DOMException + frase em inglês)
 * em algo que explica o que aconteceu, sem parecer que o código
 * quebrou.
 */
export function explicarErro(erro) {
    if (erro?.name === 'NotSupportedError') {
        return 'O aparelho recusou a sessão: ele não suporta este modo.';
    }
    if (erro?.name === 'SecurityError') {
        return 'O navegador recusou o pedido. É preciso clicar num botão (gesto do usuário) e estar em conexão segura (https).';
    }
    if (erro?.name === 'InvalidStateError') {
        return 'Já existe uma sessão aberta. Encerre-a antes de testar de novo.';
    }
    return `A sondagem falhou: ${erro?.message ?? 'motivo não informado pelo navegador.'}`;
}

/**
 * Renderiza o resultado de probeCapabilities() — a parte que não
 * precisa de sessão aberta.
 */
export function renderCapabilities(container, capabilities) {
    container.replaceChildren();

    container.appendChild(titulo('Capacidades estáticas (sem sessão)'));

    container.appendChild(linha(
        `WebXR disponível neste navegador: ${capabilities.webxr.available ? 'sim' : 'não'}`
    ));

    container.appendChild(linha(
        `Sessão inline: ${capabilities.sessions.inline.status}`
    ));
    container.appendChild(linha(
        `Sessão immersive-vr: ${capabilities.sessions.immersiveVR.status}`
    ));
    container.appendChild(linha(
        `Sessão immersive-ar: ${capabilities.sessions.immersiveAR.status}`
    ));

    if (!window.isSecureContext) {
        const aviso = linha(
            'Esta página não está em contexto seguro (https). O WebXR fica indisponível por causa disso, e não por falta de suporte do aparelho.'
        );
        aviso.style.color = '#d35400';
        container.appendChild(aviso);
    }
}

/**
 * Renderiza o resultado de probeActiveSession() — só existe depois
 * que o usuário clica no botão e a sessão de fato abre.
 */
export function renderSessionCapabilities(container, sessionCapabilities) {
    container.replaceChildren();

    container.appendChild(
        titulo(`Capacidades da sessão (${sessionCapabilities.session.type})`)
    );

    const concedidos = sessionCapabilities.session.enabledFeatures;
    container.appendChild(linha(
        `Recursos concedidos: ${concedidos.length > 0 ? concedidos.join(', ') : 'nenhum'}`
    ));

    container.appendChild(linha(
        `Fontes de entrada conectadas: ${sessionCapabilities.input.count}`
    ));

    container.appendChild(linha(
        `Rastreamento: ${sessionCapabilities.tracking.status} (graus de liberdade: ${sessionCapabilities.tracking.degreesOfFreedom ?? 'indeterminado'})`
    ));

    container.appendChild(titulo('Espaços de referência', 'h3'));
    for (const [nome, info] of Object.entries(sessionCapabilities.referenceSpaces)) {
        container.appendChild(linha(`${nome}: ${info.status}`));
    }
}