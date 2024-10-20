// Import Three.js
import * as THREE from 'three';

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

const gltfLoader = new GLTFLoader(manager);
gltfLoader.load('https://zoogit.github.io/hbb/models/hbb6.glb', (gltf) => {
    scene.add(gltf.scene);
    document.getElementById('loading').style.display = 'none'; // Hide loading div after load
}, undefined, (error) => console.error(error));

// Optimize background texture loading
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('nightsky3.jpg');
scene.background = backgroundTexture;

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Rectangle mesh with iframe texture
const rectangleGeometry = new THREE.PlaneGeometry(5, 3);
const rectangleCanvas = document.createElement('canvas');
rectangleCanvas.width = 1024;
rectangleCanvas.height = 512;
const rectangleContext = rectangleCanvas.getContext('2d');
const rectangleTexture = new THREE.CanvasTexture(rectangleCanvas);

const rectangleMaterial = new THREE.MeshBasicMaterial({ map: rectangleTexture });
const rectangleMesh = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
scene.add(rectangleMesh);

// Handle iframe loading issues with fallback to API content
async function loadBackupContent() {
    try {
        const response = await fetch('https://www.handbrewedbeer.com/'); // Replace with your API URL
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        rectangleContext.clearRect(0, 0, rectangleCanvas.width, rectangleCanvas.height);
        rectangleContext.fillStyle = 'white';
        rectangleContext.font = '20px Arial';
        rectangleContext.fillText(data.title, 50, 50);
        rectangleContext.fillText(data.description, 50, 100);
        rectangleTexture.needsUpdate = true;
    } catch (error) {
        console.error('Failed to load backup content:', error);
    }
}

// Update iframe texture or fall back to API if blocked
function updateIframeTexture() {
    try {
        // Attempt to draw iframe content (replace with your specific logic)
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
    updateRectanglePosition(); // Ensure rectangle stays aligned on resize
}, 300));

// Position camera
camera.position.z = 5;

// Animate the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
