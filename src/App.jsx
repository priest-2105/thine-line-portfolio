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

    // Add basic lighting to ensure the model is visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright white light
    directionalLight.position.set(5, 10, 5); // Position above and in front
    directionalLight.castShadow = true; // Enable shadows
    scene.add(directionalLight);

    // Debug helper to visualize scene axes
    scene.add(new THREE.AxesHelper(5));

    // Load model
    let loadedScene = null;

    const loader = new GLTFLoader();
    let gltfCameras = [];
    let activeCameraIndex = 0;
    
    // Camera animation variables (commented out)
    // let isAnimating = true;
    // let animationStartTime = 0;
    // const animationDuration = 5000; 
    // const animationDistance = 10;
    // let originalCameraPosition = null;
    loader.load(
      '/models/office.glb',
      (gltf) => {
        loadedScene = gltf.scene;
        
        scene.add(loadedScene);
        // Find cameras in the GLB
        if (gltf.cameras && gltf.cameras.length > 0) {
          gltfCameras = gltf.cameras;
          camera = gltfCameras[0];
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          console.log('Using GLB camera:', camera.name || 0);
        } else {
          // Fallback to default camera
          camera.position.set(0, 2, 5);
          camera.lookAt(0, 0, 0);
        }
        
        // Store original camera position for animation (commented out)
        // originalCameraPosition = camera.position.clone();
        // Save to ref for switching (commented out)
        // window.__gltfCameras = gltfCameras;
        // window.__setActiveCamera = (idx) => {
        //   if (gltfCameras[idx]) {
        //     camera = gltfCameras[idx];
        //     camera.aspect = window.innerWidth / window.innerHeight;
        //     camera.updateProjectionMatrix();
        //     activeCameraIndex = idx;
        //     // Update original position for animation
        //     originalCameraPosition = camera.position.clone();
        //     console.log('Switched to camera', idx, camera.name);
        //   }
        // };
        
        // Expose animation controls to window for debugging (commented out)
        // window.__startCameraAnimation = () => {
        //   if (!isAnimating) {
        //     isAnimating = true;
        //     animationStartTime = Date.now();
        //     console.log('Starting camera animation');
        //   }
        // };
        // window.__stopCameraAnimation = () => {
        //   isAnimating = false;
        //   if (originalCameraPosition) {
        //     camera.position.copy(originalCameraPosition);
        //     camera.lookAt(0, camera.position.y, 0);
        //   }
        //   console.log('Stopped camera animation');
        // };
      },
      undefined,
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

    // Camera animation function (commented out)
    // const animateCamera = () => {
    //   if (isAnimating && originalCameraPosition) {
    //     const elapsed = Date.now() - animationStartTime;
    //     const progress = Math.min(elapsed / animationDuration, 1);
    //     
    //     // Use easing function for smooth animation (ease-in-out)
    //     const easedProgress = progress < 0.5 
    //       ? 2 * progress * progress 
    //       : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    //     
    //     // Calculate new position (left to right movement)
    //     const newX = originalCameraPosition.x + (easedProgress - 0.5) * animationDistance;
    //     camera.position.x = newX;
    //     
    //     // Keep looking at the center of the scene
    //     camera.lookAt(0, camera.position.y, 0);
    //     
    //     // Stop animation when complete
    //     if (progress >= 1) {
    //       isAnimating = false;
    //     }
    //   }
    // };

    function animate() {
      requestAnimationFrame(animate);
      // animateCamera(); // commented out
      renderer.render(scene, camera);
    }
    animate();

    // Start camera animation on click (commented out)
    // const handleClick = () => {
    //   if (!isAnimating) {
    //     // Start the left-to-right animation
    //     isAnimating = true;
    //     animationStartTime = Date.now();
    //     console.log('Starting camera animation');
    //   } else {
    //     // Stop animation and reset to original position
    //     isAnimating = false;
    //     if (originalCameraPosition) {
    //       camera.position.copy(originalCameraPosition);
    //       camera.lookAt(0, camera.position.y, 0);
    //     }
    //     console.log('Stopped camera animation');
    //   }
    // };
    // window.addEventListener('click', handleClick);
    
    // Keyboard controls (commented out)
    // const handleKeyPress = (event) => {
    //   switch(event.key.toLowerCase()) {
    //     case ' ':
    //       event.preventDefault();
    //       handleClick(); // Same as click
    //       break;
    //     case 'r':
    //       // Reset camera to original position
    //       isAnimating = false;
    //       if (originalCameraPosition) {
    //         camera.position.copy(originalCameraPosition);
    //         camera.lookAt(0, camera.position.y, 0);
    //       }
    //       console.log('Reset camera position');
    //       break;
    //     case 'a':
    //       // Start animation
    //       if (!isAnimating) {
    //         isAnimating = true;
    //         animationStartTime = Date.now();
    //         console.log('Starting camera animation');
    //       }
    //       break;
    //   }
    // };
    // window.addEventListener('keydown', handleKeyPress);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      // window.removeEventListener('click', handleClick); // commented out
      // window.removeEventListener('keydown', handleKeyPress); // commented out
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