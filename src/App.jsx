
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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100vw';
  renderer.domElement.style.height = '100vh';
  mountRef.current.style.width = '100vw';
  mountRef.current.style.height = '100vh';
  mountRef.current.style.overflow = 'hidden';
  mountRef.current.style.margin = '0';
  mountRef.current.appendChild(renderer.domElement);


  // Ambient light (boosted)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  // Hemisphere light for global fill
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.8);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  // Directional light for stronger lighting and shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  // Debug helpers (uncomment to visualize lighting)
  // scene.add(new THREE.DirectionalLightHelper(dirLight, 5));
  // scene.add(new THREE.HemisphereLightHelper(hemiLight, 5));
  // scene.add(new THREE.AxesHelper(5));

    // load model
    let loadedScene = null;

    const loader = new GLTFLoader();
    let gltfCameras = [];
    let activeCameraIndex = 0;
    
    // Camera animation variables
    let isAnimating = true;
    let animationStartTime = 0;
    const animationDuration = 5000; // 5 seconds
    const animationDistance = 10; // How far left to right
    let originalCameraPosition = null;
    loader.load(
      '/models/office.glb',
      (gltf) => {
        loadedScene = gltf.scene;
        
        // Enable shadows for all meshes in the loaded scene
        loadedScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(loadedScene);
        // Find cameras in the GLB
        if (gltf.cameras && gltf.cameras.length > 0) {
          gltfCameras = gltf.cameras;
          camera = gltfCameras[0];
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          console.log('Using GLB camera:', camera.name || 0);
        } else {
          // fallback to default camera
          camera.position.set(0, 2, 5);
          camera.lookAt(0, 0, 0);
        }
        
        // Store original camera position for animation
        originalCameraPosition = camera.position.clone();
        // Save to ref for switching
        window.__gltfCameras = gltfCameras;
        window.__setActiveCamera = (idx) => {
          if (gltfCameras[idx]) {
            camera = gltfCameras[idx];
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            activeCameraIndex = idx;
            // Update original position for animation
            originalCameraPosition = camera.position.clone();
            console.log('Switched to camera', idx, camera.name);
          }
        };
        
        // Expose animation controls to window for debugging
        window.__startCameraAnimation = () => {
          if (!isAnimating) {
            isAnimating = true;
            animationStartTime = Date.now();
            console.log('Starting camera animation');
          }
        };
        window.__stopCameraAnimation = () => {
          isAnimating = false;
          if (originalCameraPosition) {
            camera.position.copy(originalCameraPosition);
            camera.lookAt(0, camera.position.y, 0);
          }
          console.log('Stopped camera animation');
        };
      },
      undefined,
      (error) => {
        console.error('Error loading GLB:', error);
      }
    );


  // camera.position.set(0, 2, 5); // Only if not using GLB camera

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


    // Camera animation function
    const animateCamera = () => {
      if (isAnimating && originalCameraPosition) {
        const elapsed = Date.now() - animationStartTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Use easing function for smooth animation (ease-in-out)
        const easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // Calculate new position (left to right movement)
        const newX = originalCameraPosition.x + (easedProgress - 0.5) * animationDistance;
        camera.position.x = newX;
        
        // Keep looking at the center of the scene
        camera.lookAt(0, camera.position.y, 0);
        
        // Stop animation when complete
        if (progress >= 1) {
          isAnimating = false;
        }
      }
    };

    function animate() {
      requestAnimationFrame(animate);
      animateCamera();
      renderer.render(scene, camera);
    }
    animate();

    // Start camera animation on click
    const handleClick = () => {
      if (!isAnimating) {
        // Start the left-to-right animation
        isAnimating = true;
        animationStartTime = Date.now();
        console.log('Starting camera animation');
      } else {
        // Stop animation and reset to original position
        isAnimating = false;
        if (originalCameraPosition) {
          camera.position.copy(originalCameraPosition);
          camera.lookAt(0, camera.position.y, 0);
        }
        console.log('Stopped camera animation');
      }
    };
    window.addEventListener('click', handleClick);
    
    // Keyboard controls
    const handleKeyPress = (event) => {
      switch(event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          handleClick(); // Same as click
          break;
        case 'r':
          // Reset camera to original position
          isAnimating = false;
          if (originalCameraPosition) {
            camera.position.copy(originalCameraPosition);
            camera.lookAt(0, camera.position.y, 0);
          }
          console.log('Reset camera position');
          break;
        case 'a':
          // Start animation
          if (!isAnimating) {
            isAnimating = true;
            animationStartTime = Date.now();
            console.log('Starting camera animation');
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyPress);
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
