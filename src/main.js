// Import Three.js and GLTFLoader from the import map
import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader'; // Correct import from the import map

// Set up basic scene components
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// GLTF loader with loading manager to show progress
const manager = new THREE.LoadingManager();
manager.onProgress = (item, loaded, total) => {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.textContent = `Loading ${loaded}/${total}`;
};

const loader = new GLTFLoader(manager);
loader.load('https://zoogit.github.io/hbb/models/hbb6.glb', (gltf) => {
    console.log(gltf); // Log the loaded model
    scene.add(gltf.scene);
    document.getElementById('loading').style.display = 'none'; // Hide loading div after load
}, undefined, (error) => console.error('Error loading model:', error));

// Optimize background texture loading
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('nightsky3.jpg');
scene.background = backgroundTexture;

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Rectangle mesh with iframe texture
const rectangleGeometry = new THREE.PlaneGeometry(5, 3);
const rectangleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Use color first for visibility
const rectangleMesh = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
rectangleMesh.position.set(0, 0, -1); // Adjust position slightly in front of the camera
scene.add(rectangleMesh);

// Create a texture for the rectangle
const rectangleCanvas = document.createElement('canvas');
rectangleCanvas.width = 1024;
rectangleCanvas.height = 512;
const rectangleContext = rectangleCanvas.getContext('2d');
const rectangleTexture = new THREE.CanvasTexture(rectangleCanvas);
rectangleMaterial.map = rectangleTexture;

// Update iframe texture or fall back to API if blocked
function updateIframeTexture() {
    try {
        // Attempt to draw iframe content
        rectangleContext.clearRect(0, 0, rectangleCanvas.width, rectangleCanvas.height);
        rectangleContext.fillStyle = 'white';
        rectangleContext.font = '30px Arial';
        rectangleContext.fillText('Iframe Content Here', 50, 50);
        rectangleTexture.needsUpdate = true;
    } catch (error) {
        console.warn('Iframe content blocked or failed, loading backup content...');
        loadBackupContent();
    }
    setTimeout(updateIframeTexture, 100); // Adjust interval as needed
}
updateIframeTexture();

// Handle window resize efficiently with debounce
function debounce(fn, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(fn, delay);
    };
}

window.addEventListener('resize', debounce(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, 300));

// Position camera
camera.position.z = 10; // Move the camera further away for visibility

// Animate the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
