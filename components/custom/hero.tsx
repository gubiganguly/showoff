'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

const AnimatedHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef(new THREE.Vector2(0.8, 0.5));
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shapeRef = useRef<THREE.Mesh | null>(null);
  const geometryRef = useRef<THREE.IcosahedronGeometry | null>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 10000);
    camera.position.set(120, 0, 300);
    cameraRef.current = camera;

    // Simple lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 0, 1);
    scene.add(frontLight);

    // Geometry with moderate subdivision
    const geometry = new THREE.IcosahedronGeometry(120, 8); // Reduced from 24 to 8
    geometryRef.current = geometry;

    const positions = geometry.attributes.position.array;
    originalPositionsRef.current = new Float32Array(positions);

    // Create pure white gradient texture
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 512;
    gradientCanvas.height = 512;
    const ctx = gradientCanvas.getContext('2d');
    if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#E6FFF8');    // Light teal-white
        gradient.addColorStop(0.3, '#B3FFE6');  // Light teal
        gradient.addColorStop(0.6, '#80FFD4');  // Medium teal
        gradient.addColorStop(0.8, '#4DFFC3');  // Bright teal
        gradient.addColorStop(1, '#00FFB3');    // Deep teal
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    const gradientTexture = new THREE.CanvasTexture(gradientCanvas);
    gradientTexture.needsUpdate = true;

    // Simpler material for cleaner look
    const material = new THREE.MeshBasicMaterial({
      map: gradientTexture,
      transparent: true,
      opacity: 0.95,
    });

    // Mesh
    const shape = new THREE.Mesh(geometry, material);
    scene.add(shape);
    shapeRef.current = shape;

    // Animation
    const updateVertices = (a: number) => {
      if (!geometryRef.current || !originalPositionsRef.current) return;
      
      const positions = geometryRef.current.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositionsRef.current[i];
        const y = originalPositionsRef.current[i + 1];
        const z = originalPositionsRef.current[i + 2];
        
        // Adjusted noise settings
        const perlin = noise3D(
          (x * 0.005) + (a * 0.0002),
          (y * 0.005) + (a * 0.0002),
          (z * 0.005)
        );
        
        const ratio = ((perlin * 0.35 * (mouseRef.current.y + 0.1)) + 0.85);
        
        positions[i] = x * ratio;
        positions[i + 1] = y * ratio;
        positions[i + 2] = z * ratio;
      }
      
      geometryRef.current.attributes.position.needsUpdate = true;
    };

    const render = (a: number) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      requestAnimationFrame((time) => render(time));
      updateVertices(a);

      if (shapeRef.current) {
        shapeRef.current.rotation.x += 0.0005;
        shapeRef.current.rotation.y += 0.0005;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    requestAnimationFrame((time) => render(time));

    const onMouseMove = (e: MouseEvent) => {
      gsap.to(mouseRef.current, {
        duration: 0.8,
        y: (e.clientY / height),
        x: (e.clientX / width),
        ease: "power1.out"
      });
    };

    const onResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const newWidth = canvasRef.current.offsetWidth;
      const newHeight = canvasRef.current.offsetHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      
      if (geometryRef.current) geometryRef.current.dispose();
      if (shapeRef.current?.material) {
        (shapeRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <h2 className="text-7xl font-bold text-white font-poppins tracking-tight">
          Quantum
        </h2>
      </div>
    </div>
  );
};

export default AnimatedHero;