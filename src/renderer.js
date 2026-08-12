import * as THREE from 'three';

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        window.devicePixelRatio
    );

    document.body.appendChild(renderer.domElement);

    return renderer;
}