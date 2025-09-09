import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './App.css';

function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    
    let camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    mountRef.current.style.width = '100vw';
    mountRef.current.style.height = '100vh';
    mountRef.current.style.overflow = 'hidden';
    mountRef.current.style.margin = '0';
    mountRef.current.appendChild(renderer.domElement);

    // Enable shadow mapping for better lighting visuals
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Set a clear color to distinguish black scene from render failure
    renderer.setClearColor(0x87CEEB); // Sky blue background

    // Add basic lighting to ensure the model is visible (adjusted for office materials)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(6.31, 10, 5); // Above scene center
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Debug helper to visualize scene axes (at scene center)
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.set(6.31, 1.11, 0.22);
    scene.add(axesHelper);

    // Load model
    let loadedScene = null;
    const sceneCenter = new THREE.Vector3(6.31, 1.11, 0.22);

    const loader = new GLTFLoader();
    let gltfCameras = [];
    let activeCameraIndex = 0;

    // Raycaster for clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    loader.load(
      '/models/office.glb',
      (gltf) => {
        loadedScene = gltf.scene;
        scene.add(loadedScene);

        // Center the scene
        loadedScene.position.sub(sceneCenter);

        // Debug: Log GLTF data
        console.log('GLTF object:', gltf);
        console.log('GLTF cameras:', gltf.cameras);

        // Find cameras in the GLB
        if (gltf.cameras && gltf.cameras.length > 0) {
          gltfCameras = gltf.cameras;
          // Prioritize primary camera by name 'Camera'
          activeCameraIndex = gltfCameras.findIndex(cam => cam.name === 'Camera') !== -1 
            ? gltfCameras.findIndex(cam => cam.name === 'Camera') 
            : 0;
          camera = gltfCameras[activeCameraIndex];
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          console.log(`Using GLB camera ${activeCameraIndex}:`, camera.name || activeCameraIndex);

          // Log all available cameras
          console.log('Available GLB cameras:');
          gltfCameras.forEach((cam, idx) => {
            console.log(`  Camera ${idx}: ${cam.name || 'Unnamed'} - Position: ${cam.position.toArray().map(n => n.toFixed(2))}, Rotation: ${cam.rotation.toArray().map(n => (n * 180 / Math.PI).toFixed(2))}deg`);
          });

          // Expose camera switching
          window.__gltfCameras = gltfCameras;
          window.__setActiveCamera = (idx) => {
            if (gltfCameras[idx]) {
              activeCameraIndex = idx;
              camera = gltfCameras[idx];
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              // Debug: Log camera details after switch
              console.log(`Switched to camera ${idx}: ${camera.name || idx}`);
              console.log(`Camera position: ${camera.position.toArray().map(n => n.toFixed(2))}`);
              console.log(`Camera rotation: ${camera.rotation.toArray().map(n => (n * 180 / Math.PI).toFixed(2))}deg`);
            } else {
              console.log(`Camera ${idx} not found`);
            }
          };
        } else {
          // Improved fallback camera
          camera.position.set(sceneCenter.x - 5, sceneCenter.y + 3, sceneCenter.z + 8);
          camera.lookAt(sceneCenter);
          console.log('No GLB cameras found, using improved fallback camera at position:', camera.position.toArray());
        }

        // Click handler for monitor
        const handleClick = (event) => {
          event.preventDefault();
          // Calculate mouse position in normalized device coordinates (-1 to +1)
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

          // Update raycaster
          raycaster.setFromCamera(mouse, camera);

          // Find monitor-related objects (broader search)
          const monitorObjects = [];
          loadedScene.traverse((child) => {
            if (child.isMesh && (
              child.name.toLowerCase().includes('monitor') ||
              child.name.toLowerCase().includes('screen') ||
              child.name === 'Lid_Screen_0' ||
              child.name === 'monitor_12' ||
              child.name === 'Laptop.001_Surface.001_0'
            )) {
              monitorObjects.push(child);
            }
          });

          // Log all clickable objects for debugging
          console.log('Clickable monitor objects:', monitorObjects.map(obj => obj.name));

          const intersects = raycaster.intersectObjects(monitorObjects, true);

          if (intersects.length > 0) {
            console.log('Clicked monitor:', intersects[0].object.name);
            if (gltfCameras.length > 1) {
              const newIndex = activeCameraIndex === 0 ? 1 : 0;
              window.__setActiveCamera(newIndex);
            } else {
              console.log('Second camera not available');
            }
          } else {
            // Proximity check: Find monitor's position and check if click is near
            let monitorObject = monitorObjects.find(obj => obj.name === 'monitor_12' || obj.name === 'Lid_Screen_0');
            if (!monitorObject) {
              monitorObject = monitorObjects[0]; // Fallback to any monitor-like object
            }
            if (monitorObject) {
              const monitorPos = new THREE.Vector3();
              monitorObject.getWorldPosition(monitorPos);
              const clickRay = raycaster.ray;
              const distance = clickRay.distanceToPoint(monitorPos);
              console.log(`Click distance from monitor (${monitorObject.name}): ${distance.toFixed(2)} units`);
              if (distance < 3) {
                console.log('Clicked near monitor:', monitorObject.name);
                if (gltfCameras.length > 1) {
                  // Toggle between primary (0) and second camera (1)
                  const newIndex = activeCameraIndex === 0 ? 1 : 0;
                  window.__setActiveCamera(newIndex);
                } else {
                  console.log('Second camera not available');
                }
              } else {
                console.log('No monitor clicked, too far:', distance.toFixed(2));
              }
            } else {
              console.log('No monitor objects found for proximity check');
            }
          }
        };
        window.addEventListener('click', handleClick);

        // Cleanup click handler
        return () => {
          window.removeEventListener('click', handleClick);
        };
      },
      (progress) => {
        console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading GLB:', error);
      }
    );

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.style.width = '100vw';
      renderer.domElement.style.height = '100vh';
      if (mountRef.current) {
        mountRef.current.style.width = '100vw';
        mountRef.current.style.height = '100vh';
      }
    };
    window.addEventListener('resize', handleResize);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (loadedScene) {
        scene.remove(loadedScene);
        loadedScene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose && m.dispose());
              } else {
                child.material.dispose && child.material.dispose();
              }
            }
            if (child.texture) child.texture.dispose && child.texture.dispose();
          }
        });
      }
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Prevent scrolling on body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }} />
  );
}

export default App;