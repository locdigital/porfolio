"use client";

import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// Create procedural matte noise texture for cube surfaces
const createMatteNoiseTexture = () => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#262830";
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
};

// 2x2x2 Floating Rounded Cube Matrix Cluster (Slow ambient auto-rotation)
const CubeCluster = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [noiseTexture, setNoiseTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setNoiseTexture(createMatteNoiseTexture());
  }, []);

  // Generate positions for 2x2x2 cube matrix
  const positions = useMemo(() => {
    const offsets = [-0.75, 0.75];
    const pos: [number, number, number][] = [];
    for (const x of offsets) {
      for (const y of offsets) {
        for (const z of offsets) {
          pos.push([x, y, z]);
        }
      }
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.018;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0.45, 0.15]}>
      {positions.map((pos, idx) => (
        <RoundedBox
          key={idx}
          position={pos}
          args={[1.15, 1.15, 1.15]}
          radius={0.12}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#22252c"
            map={noiseTexture || undefined}
            bumpMap={noiseTexture || undefined}
            bumpScale={0.015}
            roughness={0.4}
            metalness={0.3}
          />
        </RoundedBox>
      ))}
    </group>
  );
};

const FloatingAccents = () => {
  const blueRef = useRef<THREE.Mesh>(null);
  const limeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (blueRef.current) {
      blueRef.current.position.y = 2.4 + Math.sin(t * 1.3) * 0.1;
      blueRef.current.position.x = 0.2 + Math.cos(t * 0.9) * 0.06;
      blueRef.current.rotation.y += delta * 0.3;
    }
    if (limeRef.current) {
      limeRef.current.position.y = 0.3 + Math.cos(t * 1.5) * 0.08;
      limeRef.current.position.x = 3.4 + Math.sin(t * 0.8) * 0.06;
      limeRef.current.rotation.y -= delta * 0.3;
    }
  });

  return (
    <group>
      {/* Blue accent sphere on top center-right */}
      <mesh ref={blueRef} position={[0.2, 2.4, 0.5]} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#1d4ed8"
          emissiveIntensity={0.6}
          roughness={0.12}
          metalness={0.85}
        />
      </mesh>

      {/* Lime Green accent sphere on far right */}
      <mesh ref={limeRef} position={[3.4, 0.3, 0.5]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#84cc16"
          emissive="#4d7c0f"
          emissiveIntensity={0.6}
          roughness={0.12}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
};

export function ClayHeroCanvas() {
  return (
    <div className="w-full h-full min-h-[460px] lg:min-h-[580px] relative pointer-events-none">
      <Canvas shadows camera={{ position: [0, 2.5, 9.5], fov: 42 }} dpr={[1, 2]}>
        <Environment preset="city" />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 8, 5]}
          intensity={2.2}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-6, -4, -4]} intensity={1.2} color="#0284c7" />

        <group rotation={[Math.PI / 16, 0, 0]}>
          <Suspense fallback={null}>
            <CubeCluster />
            <FloatingAccents />
            <Environment preset="city" />
          </Suspense>
        </group>
      </Canvas>
    </div>
  );
}

export interface ClayHeroProps {
  kicker?: string;
  title?: React.ReactNode;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
}

export default function ClayHeroSection({
  kicker = "Crypto & Web3",
  title = "Shaping Crypto into the Future Everyone Believes In",
  description = "We transform crypto branding, web design, and UX to make your Web3 project shine and engage users with clarity and impact.",
  ctaText = "Let's talk",
  ctaHref = "#contact",
}: ClayHeroProps) {
  return (
    <div className="w-full bg-[#13151b] text-white min-h-screen font-sans flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Clay Header */}
      <header className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-6 flex items-center justify-between z-30 relative">
        <a href="#" className="flex items-center gap-2.5 text-white font-bold text-2xl tracking-tight">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28V4Z" fill="white" />
          </svg>
          clay
        </a>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#" className="hover:text-white transition-colors">Work</a>
          <a href="#" className="hover:text-white transition-colors">Clients</a>
          <a href="#" className="hover:text-white transition-colors">Services</a>
          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-white transition-colors">
            <span>Industries</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Blog</a>
        </nav>

        {/* Contact CTA Button */}
        <a
          href={ctaHref}
          className="bg-white text-black font-medium text-sm px-6 py-2.5 rounded-full hover:bg-zinc-200 transition-all shadow-sm"
        >
          Contact
        </a>
      </header>

      {/* Main Hero Content Grid */}
      <main className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-8 my-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-20">
        {/* Left Text Content */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <span className="text-zinc-400 text-sm font-medium mb-4 tracking-wide">
            {kicker}
          </span>
          
          <h1 className="text-4xl sm:text-5xl lg:text-[4.2rem] font-bold text-white leading-[1.06] tracking-tight mb-6 max-w-[640px] font-sans">
            {title}
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-[500px] mb-8 font-normal">
            {description}
          </p>

          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-white text-black font-medium text-base px-7 py-3.5 rounded-full hover:bg-zinc-200 transition-all shadow-lg group"
          >
            <span>{ctaText}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        {/* Right 3D Canvas */}
        <div className="lg:col-span-6 w-full h-[460px] lg:h-[560px] relative">
          <ClayHeroCanvas />
        </div>
      </main>

      {/* Trusted By Client Logos Bar */}
      <footer className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 pb-12 pt-6 text-center z-20 relative">
        <p className="text-zinc-400 text-xs sm:text-sm font-medium tracking-wider mb-8">
          Trusted by the crypto industry leaders
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 md:gap-16 opacity-85 hover:opacity-100 transition-opacity">
          {/* Coinbase */}
          <span className="text-white font-bold text-xl sm:text-2xl tracking-tight font-sans">
            coinbase
          </span>

          {/* zkSync */}
          <div className="flex items-center gap-2 text-white font-semibold text-lg sm:text-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
            </svg>
            <span>zkSync</span>
          </div>

          {/* GRAYSCALE */}
          <span className="text-white font-bold text-lg sm:text-xl tracking-widest uppercase font-serif">
            GRAYSCALE
          </span>

          {/* Sky */}
          <div className="flex items-center gap-1.5 text-white font-bold text-xl sm:text-2xl tracking-tight">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span>Sky</span>
          </div>

          {/* Avalanche */}
          <div className="flex items-center gap-2 text-white font-semibold text-lg sm:text-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22H7.5L12 13L16.5 22H22L12 2Z" />
            </svg>
            <span className="lowercase">avalanche</span>
          </div>

          {/* MEXC */}
          <div className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl tracking-wider">
            <svg width="22" height="18" viewBox="0 0 24 20" fill="currentColor">
              <path d="M0 20L6 0L12 12L18 0L24 20H18L14 7L12 13L10 7L6 20H0Z" />
            </svg>
            <span>MEXC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { ClayHeroSection as Component };

export function Demo() {
  return <ClayHeroSection />;
}
