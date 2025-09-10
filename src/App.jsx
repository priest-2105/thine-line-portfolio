import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './App.css';

function App() {
  const mountRef = useRef(null);
  const clickDivRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    
    let camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    mountRef.current.style.width = '100vw';
    mountRef.current.style.height = '100vh';
    mountRef.current.style.overflow = 'hidden';
    mountRef.current.style.margin = '0';
    mountRef.current.style.position = 'relative';
    mountRef.current.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(6.31, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.set(6.31, 1.11, 0.22);
    scene.add(axesHelper);

    let loadedScene = null;
    const sceneCenter = new THREE.Vector3(6.31, 1.11, 0.22);
    const loader = new GLTFLoader();
    let gltfCameras = [];
    let activeCameraIndex = 0; 
    let isAnimating = false;
    let animationStartTime = null;
    let startPosition = new THREE.Vector3();
    let startQuaternion = new THREE.Quaternion();
    let targetPosition = new THREE.Vector3();
    let targetQuaternion = new THREE.Quaternion();
    let originalPosition = null;
    let originalQuaternion = null;

    loader.load(
      '/models/office.glb',
      (gltf) => {
        loadedScene = gltf.scene;
        scene.add(loadedScene);
        loadedScene.position.sub(sceneCenter);

        console.log('GLTF object:', gltf);
        console.log('GLTF cameras:', gltf.cameras);

        if (gltf.cameras && gltf.cameras.length > 0) {
          gltfCameras = gltf.cameras;
          activeCameraIndex = gltfCameras.findIndex(cam => cam.name === 'Camera') !== -1 
            ? gltfCameras.findIndex(cam => cam.name === 'Camera') 
            : 0;
          cameraRef.current = gltfCameras[activeCameraIndex];
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
          // Store original position and rotation
          originalPosition = cameraRef.current.position.clone();
          originalQuaternion = cameraRef.current.quaternion.clone();
          console.log(`Using GLB camera ${activeCameraIndex}:`, cameraRef.current.name || activeCameraIndex);
          console.log(`Camera position: ${cameraRef.current.position.toArray().map(n => n.toFixed(2))}`);
          console.log(`Camera rotation: ${cameraRef.current.rotation.toArray().map(n => (n * 180 / Math.PI).toFixed(2))}deg`);

          console.log('Available GLB cameras:');
          gltfCameras.forEach((cam, idx) => {
            console.log(`  Camera ${idx}: ${cam.name || 'Unnamed'} - Position: ${cam.position.toArray().map(n => n.toFixed(2))}, Rotation: ${cam.rotation.toArray().map(n => (n * 180 / Math.PI).toFixed(2))}deg`);
          });

          window.__gltfCameras = gltfCameras;
        } else {
          cameraRef.current.position.set(sceneCenter.x - 5, sceneCenter.y + 3, sceneCenter.z + 8);
          cameraRef.current.lookAt(sceneCenter);
          originalPosition = cameraRef.current.position.clone();
          originalQuaternion = cameraRef.current.quaternion.clone();
          console.log('No GLB cameras found, using fallback camera at position:', cameraRef.current.position.toArray());
        }

        // Click handler for the center div
        const handleDivClick = () => {
          if (isAnimating) {
            console.log('Animation in progress, ignoring click');
            return;
          }
          console.log('Center div clicked');
          if (gltfCameras.length > 1) {
            isAnimating = true;
            animationStartTime = performance.now();
            startPosition.copy(cameraRef.current.position);
            startQuaternion.copy(cameraRef.current.quaternion);
            if (activeCameraIndex === 0) {
              // Move to second camera's position and rotation
              targetPosition.set(0.04, 1.24, 0.73); // second camera position
              targetQuaternion.copy(gltfCameras[1].quaternion);
              activeCameraIndex = 1;
              console.log('Animating to second camera position:', targetPosition.toArray().map(n => n.toFixed(2)));
            } else {
              // Move back to original position and rotation
              targetPosition.copy(originalPosition);
              targetQuaternion.copy(originalQuaternion);
              activeCameraIndex = 0;
              console.log('Animating to original position:', targetPosition.toArray().map(n => n.toFixed(2)));
            }
          } else {
            console.log('Second camera not available');
          }
        };
        if (clickDivRef.current) {
          clickDivRef.current.onclick = handleDivClick;
          console.log('Click handler attached to div');
        }

        return () => {
          if (clickDivRef.current) {
            clickDivRef.current.onclick = null;
          }
        };
      },
      (progress) => {
        console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading GLB:', error);
      }
    );

    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
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
      if (isAnimating) {
        const elapsed = (performance.now() - animationStartTime) / 1000;
        const t = Math.min(elapsed / 2, 1); 
        cameraRef.current.position.lerpVectors(startPosition, targetPosition, t);
        cameraRef.current.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, t);
        if (t === 1) {
          isAnimating = false;
          console.log('Animation complete, camera at:', cameraRef.current.position.toArray().map(n => n.toFixed(2)));
          console.log('Camera rotation:', cameraRef.current.rotation.toArray().map(n => (n * 180 / Math.PI).toFixed(2)));
        }
      }
      renderer.render(scene, cameraRef.current);
    }
    animate();

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
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, position: 'relative' }}>
      <div
        ref={clickDivRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px',
          height: '100px',
          backgroundColor: 'red',
          cursor: 'pointer',
          zIndex: 10,
          border: '2px solid black'
        }}
      />
    </div>
  );
}

export default App;