"use client";

import React, { useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

// White matte clay material settings
const clayMaterialProps = {
  color: "#f5f5f7",
  roughness: 0.32,
  metalness: 0.04,
  clearcoat: 0.08,
  clearcoatRoughness: 0.3,
};

const SatelliteDishScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const dishGroupRef = useRef<THREE.Group>(null);
  const purpleSphereRef = useRef<THREE.Mesh>(null);
  const orangeSphereRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  // Mouse move listener for smooth 3D tilt interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -(e.clientY / innerHeight) * 2 + 1;
      
      targetRotation.current = {
        x: y * 0.35,
        y: x * 0.45,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Smooth 3D tilt interaction tracking mouse movement + gentle breathing drift
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotation.current.x + Math.sin(t * 0.8) * 0.03,
      delta * 4
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation.current.y + Math.cos(t * 0.6) * 0.04,
      delta * 4
    );

    // Subtle floating breathing effect
    groupRef.current.position.y = Math.sin(t * 1.0) * 0.04;

    // Floating animation for top purple sphere
    if (purpleSphereRef.current) {
      purpleSphereRef.current.position.y = 2.1 + Math.sin(t * 1.4) * 0.08;
      purpleSphereRef.current.position.x = -0.2 + Math.cos(t * 0.9) * 0.04;
    }

    // Floating animation for inner glowing orange sphere
    if (orangeSphereRef.current) {
      orangeSphereRef.current.position.y = -0.45 + Math.cos(t * 1.2) * 0.05;
      orangeSphereRef.current.position.x = 0.65 + Math.sin(t * 0.8) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={0.92}>
      {/* Tilted Hemisphere Dish Group */}
      <group ref={dishGroupRef} rotation={[0.45, -0.55, -0.35]}>
        {/* Outer Curved Dome */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[2.0, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial {...clayMaterialProps} side={THREE.DoubleSide} />
        </mesh>

        {/* Flat Inner Surface */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[1.99, 64]} />
          <meshStandardMaterial {...clayMaterialProps} side={THREE.DoubleSide} />
        </mesh>

        {/* Center Pivot Indentation */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 32]} />
          <meshStandardMaterial color="#c4c4c8" roughness={0.45} />
        </mesh>
      </group>

      {/* Floating Purple/Pink Accent Sphere (Top Left) */}
      <mesh ref={purpleSphereRef} position={[-0.2, 2.1, 0.3]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={0.85}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Orange Accent Sphere & Point Light (Bottom Right Inner Bowl) */}
      <group ref={orangeSphereRef} position={[0.65, -0.45, 0.85]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#ff6b00"
            emissive="#ff3d00"
            emissiveIntensity={1.4}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        
        {/* Point light casting warm orange glow onto white inner dish */}
        <pointLight color="#ff5500" intensity={4.2} distance={3.5} decay={2} />
      </group>
    </group>
  );
};

export default function About3DGraphic() {
  return (
    <div className="w-full h-full min-h-[380px] sm:min-h-[440px] relative flex items-center justify-center">
      <Canvas
        shadows
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        dpr={[1, 2]}
        className="w-full h-full"
      >
        <ambientLight intensity={0.7} />
        
        {/* Main studio directional light */}
        <directionalLight
          position={[6, 8, 6]}
          intensity={2.2}
          color="#ffffff"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        
        {/* Fill lights */}
        <directionalLight position={[-6, -4, 4]} intensity={0.7} color="#e0e7ff" />
        <directionalLight position={[0, -5, -4]} intensity={0.4} color="#ffffff" />

        <Suspense fallback={null}>
          <SatelliteDishScene />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
