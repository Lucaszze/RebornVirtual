const SESSION_TYPES = {
    inline: 'inline',
    immersiveVR: 'immersive-vr',
    immersiveAR: 'immersive-ar'
};

const FEATURES = [
    'local',
    'local-floor',
    'bounded-floor',
    'unbounded',
    'viewer',
    'hand-tracking',
    'hit-test',
    'dom-overlay',
    'anchors',
    'depth-sensing',
    'layers'
];

const REFERENCE_SPACES = [
    'viewer',
    'local',
    'local-floor',
    'bounded-floor',
    'unbounded'
];

function result(supported, status, extra = {}) {
    return {
        supported,
        status,
        ...extra
    };
}

async function probeSessionSupport(xr, sessionType) {
    try {
        const supported = await xr.isSessionSupported(sessionType);

        return result(
            supported,
            supported ? 'supported' : 'unsupported'
        );
    } catch (error) {
        return result(false, 'error', {
            error: {
                name: error?.name ?? 'UnknownError',
                message: error?.message ?? 'Unknown error'
            }
        });
    }
}

function createUnknownFeature(status = 'requires-session') {
    return result(null, status);
}

function createUnknownReferenceSpace() {
    return result(null, 'requires-session');
}

/**
 * Executa a parte da sonda que pode ser feita sem
 * iniciar uma sessão XR imersiva.
 */
export async function probeCapabilities() {
    const capabilities = {
        timestamp: new Date().toISOString(),

        webxr: {
            available: false,
            status: 'unavailable'
        },

        sessions: {
            inline: result(null, 'not-tested'),
            immersiveVR: result(null, 'not-tested'),
            immersiveAR: result(null, 'not-tested')
        },

        features: {},

        referenceSpaces: {},

        input: {
            sources: [],
            count: 0,
            status: 'requires-session'
        },

        tracking: {
            degreesOfFreedom: null,
            positionTracking: null,
            orientationTracking: null,
            status: 'requires-session'
        },

        session: {
            active: false,
            type: null,
            enabledFeatures: [],
            status: 'not-started'
        }
    };

    // ---------------------------------------------
    // WebXR
    // ---------------------------------------------

    if (!('xr' in navigator) || !navigator.xr) {
        for (const feature of FEATURES) {
            capabilities.features[feature] =
                result(false, 'webxr-unavailable');
        }

        for (const space of REFERENCE_SPACES) {
            capabilities.referenceSpaces[space] =
                result(false, 'webxr-unavailable');
        }

        return capabilities;
    }

    const xr = navigator.xr;

    capabilities.webxr = {
        available: true,
        status: 'available'
    };

    // ---------------------------------------------
    // Tipos de sessão
    // ---------------------------------------------

    capabilities.sessions.inline =
        await probeSessionSupport(
            xr,
            SESSION_TYPES.inline
        );

    capabilities.sessions.immersiveVR =
        await probeSessionSupport(
            xr,
            SESSION_TYPES.immersiveVR
        );

    capabilities.sessions.immersiveAR =
        await probeSessionSupport(
            xr,
            SESSION_TYPES.immersiveAR
        );

    // ---------------------------------------------
    // Recursos
    //
    // Ainda não podemos afirmar que foram concedidos.
    // Isso será descoberto dentro de uma XRSession.
    // ---------------------------------------------

    for (const feature of FEATURES) {
        capabilities.features[feature] =
            createUnknownFeature();
    }

    // ---------------------------------------------
    // Reference spaces
    // ---------------------------------------------

    for (const space of REFERENCE_SPACES) {
        capabilities.referenceSpaces[space] =
            createUnknownReferenceSpace();
    }

    return capabilities;
}

/**
 * Analisa uma XRSession REAL.
 *
 * Esta função deve ser chamada depois que o usuário
 * iniciar uma sessão XR.
 */
export async function probeActiveSession(
    session,
    sessionType
) {
    const sessionCapabilities = {
        session: {
            active: true,
            type: sessionType,
            enabledFeatures: [],
            status: 'active'
        },

        features: {},

        referenceSpaces: {},

        input: {
            sources: [],
            count: 0,
            status: 'available'
        },

        tracking: {
            degreesOfFreedom: null,
            positionTracking: null,
            orientationTracking: null,
            status: 'unknown'
        }
    };

    // ---------------------------------------------
    // Recursos efetivamente concedidos
    // ---------------------------------------------

    const enabledFeatures = Array.from(
        session.enabledFeatures ?? []
    );

    sessionCapabilities.session.enabledFeatures =
        enabledFeatures;

    for (const feature of FEATURES) {
        if (enabledFeatures.includes(feature)) {
            sessionCapabilities.features[feature] =
                result(true, 'granted');
        } else {
            sessionCapabilities.features[feature] =
                result(false, 'not-granted');
        }
    }

    // ---------------------------------------------
    // Fontes de entrada
    // ---------------------------------------------

    const inputSources = Array.from(
        session.inputSources ?? []
    );

    sessionCapabilities.input.sources =
        inputSources.map((source) => ({
            handedness: source.handedness ?? 'unknown',
            targetRayMode: source.targetRayMode ?? 'unknown',
            profiles: Array.from(source.profiles ?? []),
            hasGripSpace: Boolean(source.gripSpace),
            hasTargetRaySpace: Boolean(
                source.targetRaySpace
            ),
            hasHandTracking: Boolean(source.hand),
            hasGamepad: Boolean(source.gamepad)
        }));

    sessionCapabilities.input.count =
        sessionCapabilities.input.sources.length;

    // ---------------------------------------------
    // Reference spaces
    // ---------------------------------------------

    for (const spaceType of REFERENCE_SPACES) {
        try {
            await session.requestReferenceSpace(
                spaceType
            );

            sessionCapabilities.referenceSpaces[
                spaceType
            ] = result(
                true,
                'supported'
            );
        } catch (error) {
            sessionCapabilities.referenceSpaces[
                spaceType
            ] = result(
                false,
                error?.name === 'NotSupportedError'
                    ? 'unsupported'
                    : 'error',
                {
                    error: {
                        name: error?.name ?? 'UnknownError',
                        message:
                            error?.message ??
                            'Unknown error'
                    }
                }
            );
        }
    }

    // ---------------------------------------------
    // Rastreamento / DoF
    // ---------------------------------------------

    const localSupported =
        sessionCapabilities.referenceSpaces.local.supported === true;

    const localFloorSupported =
        sessionCapabilities.referenceSpaces[
            'local-floor'
        ].supported === true;

    const boundedFloorSupported =
        sessionCapabilities.referenceSpaces[
            'bounded-floor'
        ].supported === true;

    const unboundedSupported =
        sessionCapabilities.referenceSpaces.unbounded.supported === true;

    /*
     * WebXR não possui uma propriedade universal:
     *
     *     session.degreesOfFreedom
     *
     * Portanto não vamos inventar esse valor.
     *
     * Quando há reference spaces de chão/ambiente,
     * temos evidência de rastreamento espacial
     * suficiente para classificar o dispositivo como
     * 6DoF-capable.
     */

    if (
        localFloorSupported ||
        boundedFloorSupported ||
        unboundedSupported
    ) {
        sessionCapabilities.tracking = {
            degreesOfFreedom: 6,
            positionTracking: true,
            orientationTracking: true,
            status: 'inferred-from-spatial-reference-spaces'
        };
    } else if (localSupported) {
        sessionCapabilities.tracking = {
            degreesOfFreedom: null,
            positionTracking: null,
            orientationTracking: true,
            status: 'orientation-known-position-unknown'
        };
    } else {
        sessionCapabilities.tracking = {
            degreesOfFreedom: null,
            positionTracking: null,
            orientationTracking: null,
            status: 'unknown'
        };
    }

    return sessionCapabilities;
}

// sessão de diagnóstico, pois por agr nn temos uma sessão VR //

export async function startCapabilitySession(
    sessionType = 'inline'
) {
    if (!navigator.xr) {
        throw new Error(
            'WebXR não está disponível.'
        );
    }

    let optionalFeatures = [];

    if (sessionType === 'inline') {
        optionalFeatures = [
            'local',
            'local-floor'
        ];
    }

    if (sessionType === 'immersive-vr') {
        optionalFeatures = [
            'local',
            'local-floor',
            'bounded-floor',
            'hand-tracking',
            'layers'
        ];
    }

    if (sessionType === 'immersive-ar') {
        optionalFeatures = [
            'local',
            'local-floor',
            'hit-test',
            'dom-overlay',
            'anchors'
        ];
    }

    return await navigator.xr.requestSession(
        sessionType,
        {
            optionalFeatures
        }
    );
}