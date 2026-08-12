import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupXR } from './xr.js';

const scene = createScene();
const camera = createCamera();
const renderer = createRenderer();

setupXR(renderer);

function animate() {
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);