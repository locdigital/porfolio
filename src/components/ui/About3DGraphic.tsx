"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function About3DGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Dimension helper with guaranteed positive min dimensions
    const getDims = () => {
      const w = Math.max(container.clientWidth || 0, container.offsetWidth || 0, 340);
      const h = Math.max(container.clientHeight || 0, container.offsetHeight || 0, w);
      return { w, h };
    };

    let { w, h } = getDims();

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    camera.position.set(0, 0, 7.2);

    // 2. WebGL Renderer with graceful fallback check
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("WebGL not supported or context creation failed:", err);
      setWebglSupported(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.2);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(6, 8, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.8);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    // 4. Main Root Group (Mouse Tilt + Floating)
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 5. White Clay Hemisphere Dish Group
    const dishGroup = new THREE.Group();
    dishGroup.rotation.set(0.45, -0.55, -0.35);
    rootGroup.add(dishGroup);

    const clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.32,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    // Outer Dome
    const domeGeo = new THREE.SphereGeometry(2.0, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeo, clayMaterial);
    domeMesh.castShadow = true;
    domeMesh.receiveShadow = true;
    dishGroup.add(domeMesh);

    // Flat Inner Circle
    const circleGeo = new THREE.CircleGeometry(1.99, 64);
    const circleMesh = new THREE.Mesh(circleGeo, clayMaterial);
    circleMesh.rotation.x = Math.PI / 2;
    circleMesh.receiveShadow = true;
    dishGroup.add(circleMesh);

    // Center Pivot
    const pivotGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0xc4c4c8, roughness: 0.45 });
    const pivotMesh = new THREE.Mesh(pivotGeo, pivotMat);
    pivotMesh.rotation.x = Math.PI / 2;
    pivotMesh.position.z = 0.02;
    dishGroup.add(pivotMesh);

    // 6. 3D Purple Orb (Orbiting 360° around dish)
    const purpleGeo = new THREE.SphereGeometry(0.18, 32, 32);
    const purpleMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.8,
    });
    const purpleSphere = new THREE.Mesh(purpleGeo, purpleMat);
    purpleSphere.castShadow = true;
    rootGroup.add(purpleSphere);

    // 7. 3D Orange Orb & PointLight (Orbiting 360° around dish inner bowl)
    const orangeGroup = new THREE.Group();
    rootGroup.add(orangeGroup);

    const orangeGeo = new THREE.SphereGeometry(0.16, 32, 32);
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      emissive: 0xff3d00,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.8,
    });
    const orangeSphere = new THREE.Mesh(orangeGeo, orangeMat);
    orangeSphere.castShadow = true;
    orangeGroup.add(orangeSphere);

    const orangeLight = new THREE.PointLight(0xff5500, 5.0, 4.0, 2);
    orangeGroup.add(orangeLight);

    // 8. Mouse Interactive Tilt & Window Resize
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseX = y * 0.35;
      mouseY = x * 0.45;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container || !renderer) return;
      const { w: newW, h: newH } = getDims();
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. Animation Loop (60 FPS)
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      const t = (performance.now() - startTime) * 0.001;

      // Mouse tilt lerp + floating
      rootGroup.rotation.x += (mouseX + Math.sin(t * 0.7) * 0.03 - rootGroup.rotation.x) * 0.05;
      rootGroup.rotation.y += (mouseY + Math.cos(t * 0.5) * 0.04 - rootGroup.rotation.y) * 0.05;
      rootGroup.position.y = Math.sin(t * 1.0) * 0.05;

      // Purple Orb 360 Degree Orbit
      const purpleAngle = t * 0.85;
      purpleSphere.position.x = Math.cos(purpleAngle) * 2.3 - 0.2;
      purpleSphere.position.y = Math.sin(purpleAngle) * 1.4 + 0.8;
      purpleSphere.position.z = Math.sin(purpleAngle * 2) * 0.6 + 0.3;

      // Orange Orb 360 Degree Counter-Orbit
      const orangeAngle = -t * 1.1 + Math.PI;
      orangeGroup.position.x = Math.cos(orangeAngle) * 1.7 + 0.3;
      orangeGroup.position.y = Math.sin(orangeAngle) * 1.0 - 0.35;
      orangeGroup.position.z = Math.cos(orangeAngle * 1.5) * 0.55 + 0.5;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[380px] sm:min-h-[460px] relative flex items-center justify-center overflow-hidden pointer-events-none select-none"
      onContextMenu={(e) => e.preventDefault()}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block relative z-10 pointer-events-none select-none" />
      
      {/* Fallback image if WebGL fails */}
      {!webglSupported && (
        <div
          className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat pointer-events-none select-none"
          style={{ backgroundImage: "url('/images/about-dish.png')" }}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}
