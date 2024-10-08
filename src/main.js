let scene, camera, renderer, circularLandscape, mixer, rectangle;
const loadingDiv = document.getElementById('loading');

let angle = 0; // Initialize an angle for the camera rotation
let composer; // For post-processing
let hovering = false; // A flag to check if the rectangle is in hover mode
let hoverClock = 0; // A variable to keep track of hover oscillation
let isMobile = false; // Flag to check if the device is mobile

// Create a canvas to render the webpage onto
const webpageCanvas = document.createElement('canvas');
const webpageContext = webpageCanvas.getContext('2d');
webpageCanvas.width = 512;
webpageCanvas.height = 512;

// Render an iframe or webpage content onto the canvas
const iframe = document.createElement('iframe');
iframe.src = 'https://handbrewedbeer.com'; // URL of the webpage you want to display
iframe.style.width = '512px';
iframe.style.height = '512px';
iframe.style.border = 'none';
iframe.onload = () => {
    setInterval(() => {
        webpageContext.drawImage(iframe, 0, 0, 512, 512);
    }, 1000 / 30); // 30 FPS update
};

// Add iframe to the document but keep it hidden
document.body.appendChild(iframe);
iframe.style.position = 'absolute';
iframe.style.visibility = 'hidden';

function init() {
    scene = new THREE.Scene();

    // Use a cubemap for the background
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const texture = cubeTextureLoader.load([
        'nightsky3.jpg', // positive x (right)
        'nightsky3.jpg', // negative x (left)
        'nightsky3.jpg', // positive y (top)
        'nightsky3.jpg', // negative y (bottom)
        'nightsky3.jpg', // positive z (front)
        'nightsky3.jpg'  // negative z (back)
    ], () => {
        console.log('Cubemap loaded successfully');
    }, undefined, (error) => {
        console.error('An error occurred while loading the cubemap:', error);
    });

    scene.background = texture;

    // Add dynamic stars
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0x4CAF50, size: 2 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    camera = new THREE.PerspectiveCamera(83, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    composer.addPass(bloomPass);

    const ambientLight = new THREE.AmbientLight(0xFFFFF, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFF, 1.5);
    directionalLight.position.set(1, 1, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load('models/hbb6.glb', (gltf) => {
        circularLandscape = gltf.scene;
        mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });

        circularLandscape.scale.set(1, 1, 1);
        circularLandscape.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        circularLandscape.position.set(-1, -1, 0);
        scene.add(circularLandscape);
        loadingDiv.style.display = 'none';
    }, undefined, (error) => {
        console.error('An error occurred while loading the GLB file:', error);
        loadingDiv.textContent = 'Failed to load 3D model.';
    });

    const rectangleGeometry = new THREE.BoxGeometry(4, 5, 1);
    const webpageTexture = new THREE.CanvasTexture(webpageCanvas);

    const materials = [
        new THREE.MeshBasicMaterial({ map: webpageTexture }),
        new THREE.MeshBasicMaterial({ map: webpageTexture }),
        new THREE.MeshBasicMaterial({ map: webpageTexture }),
        new THREE.MeshBasicMaterial({ map: webpageTexture }),
        new THREE.MeshBasicMaterial({ map: webpageTexture }),
        new THREE.MeshBasicMaterial({ map: webpageTexture })
    ];

    rectangle = new THREE.Mesh(rectangleGeometry, materials);
    rectangle.visible = false;
    scene.add(rectangle);

    updateRectanglePosition();

    animate(starField, starsMaterial);
}

function updateRectanglePosition() {
    isMobile = window.innerWidth < 768;

    if (!isMobile) {
        rectangle.position.set(0, 0, 5);
    }
}

function animate(starField, starsMaterial) {
    requestAnimationFrame(() => animate(starField, starsMaterial));

    angle += 0.00;
    camera.position.x = 12 * Math.cos(angle);
    camera.position.z = 10 * Math.sin(angle);
    camera.lookAt(1, 2, 0);

    const time = Date.now() * 0.002;
    starsMaterial.size = 1 + Math.sin(time) * 0.5;

    if (mixer) {
        mixer.update(0.01);
    }

    if (hovering) {
        hoverClock += 0.02;
        rectangle.position.y = 5 + Math.sin(hoverClock) * 0.5;
    }

    composer.render();
}

window.addEventListener('scroll', () => {
    if (circularLandscape) {
        const scrollPosition = window.scrollY;
        circularLandscape.rotation.y = scrollPosition * 0.0005;

        const revealPosition = isMobile ? 500 : 1000;
        const moveThreshold = isMobile ? 1500 : 2000;

        if (scrollPosition > revealPosition) {
            rectangle.visible = true;

            if (scrollPosition <= moveThreshold) {
                const scrollProgress = (scrollPosition - revealPosition) / (moveThreshold - revealPosition);
                const targetPositionZ = 0.75 + scrollProgress * 0.75;

                rectangle.position.z = targetPositionZ;
            }
        }
    }
});

init();
