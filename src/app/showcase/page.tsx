'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

const showcaseSrcs = [1, 4, 6, 9, 12, 16, 19, 22, 25, 28, 31, 34].map(
  (number) => `/assets/photos/img-portfolio/photo-${number}.webp`
);

export default function Page() {
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    // If THREE is already loaded (e.g. client side navigation back to this page)
    if ((window as any).THREE) {
      setThreeLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!threeLoaded) return;

    const THREE = (window as any).THREE;
    if (!THREE) return;

    const SRCS = showcaseSrcs;
    const N = SRCS.length;
    const CW = 1.52; // card width
    const CH = 1.00; // card height (landscape)
    const PHASES = ['Scatter', 'Alignment', 'Circle', 'Arc', 'Gallery'];

    const canvas = document.getElementById('c') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06060a);
    scene.fog = new THREE.FogExp2(0x06060a, 0.048);

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    const key = new THREE.DirectionalLight(0xd6ecff, 1.4);
    key.position.set(6, 10, 7);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xfff0d8, 0.55);
    rim.position.set(-7, -4, -5);
    scene.add(rim);

    const fill = new THREE.PointLight(0x8090ff, 0.3, 30);
    fill.position.set(0, 0, 8);
    scene.add(fill);

    function rng(seed: number) {
      let s = seed | 0;
      return function () {
        s = (s ^ (s << 13)) | 0;
        s = (s ^ (s >> 17)) | 0;
        s = (s ^ (s << 5)) | 0;
        return (s >>> 0) / 4294967296;
      };
    }

    function posScatter(i: number) {
      const r = rng(i * 3571 + 17);
      return new THREE.Vector3(
        (r() - 0.5) * 20,
        (r() - 0.5) * 11,
        (r() - 0.5) * 14 - 3
      );
    }
    
    function rotScatter(i: number) {
      const r = rng(i * 5003 + 41);
      return { x: (r() - 0.5) * 0.55, y: (r() - 0.5) * 0.7, z: (r() - 0.5) * 0.45 };
    }

    function posLine(i: number) {
      const span = (N - 1) * 1.72;
      return new THREE.Vector3(i * 1.72 - span * 0.5, 0, 0);
    }

    function posCircle(i: number) {
      const a = (i / N) * Math.PI * 2 - Math.PI * 0.5;
      const r = 4.4;
      return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    
    function rotCircle(i: number) {
      const a = (i / N) * Math.PI * 2 - Math.PI * 0.5;
      return { x: 0, y: 0, z: a + Math.PI * 0.5 };
    }

    const posArc = (i: number) => {
      const t = i / (N - 1) - 0.5;
      const a = t * Math.PI * 1.25;
      const r = 5.6;
      return new THREE.Vector3(
        Math.sin(a) * r,
        Math.cos(a) * r * -0.42 + 1.8,
        0
      );
    };
    
    const rotArc = (i: number) => {
      const t = i / (N - 1) - 0.5;
      return { x: 0, y: t * 0.5, z: 0 };
    };

    function posGallery(i: number, offset = 0) {
      const t = i / (N - 1) - 0.5;
      const a = t * Math.PI * 1.35 + offset;
      const r = 5.8;
      return new THREE.Vector3(
        Math.sin(a) * r,
        Math.cos(a) * r * -0.3 + 2.0,
        Math.sin(a * 2) * 0.7
      );
    }

    const geo = new THREE.PlaneGeometry(CW, CH, 1, 1);
    const loader = new THREE.TextureLoader();
    const cards: any[] = [];
    let loaded = 0;
    const loadingEl = document.getElementById('loading');
    const hintEl = document.getElementById('hint');

    SRCS.forEach((src, i) => {
      loader.load(src, (tex: any) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;

        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.1,
          metalness: 0.04,
        });
        const mesh = new THREE.Mesh(geo, mat);

        const sp = posScatter(i);
        const sr = rotScatter(i);
        mesh.position.copy(sp);
        mesh.rotation.set(sr.x, sr.y, sr.z);
        scene.add(mesh);

        cards[i] = {
          mesh: mesh,
          i: i,
          cx: sp.x, cy: sp.y, cz: sp.z,
          crx: sr.x, cry: sr.y, crz: sr.z,
          csx: 1, csy: 1,
          vx: 0, vy: 0, vz: 0,
          vrx: 0, vry: 0, vrz: 0,
          vsx: 0, vsy: 0,
        };

        loaded++;
        if (loaded === N) {
          loadingEl?.classList.add('out');
        }
      });
    });

    let scrollT = 0;
    let smoothT = 0;

    function syncScrollProgress() {
      const el = document.getElementById('scroll-driver');
      if (!el) return;
      const max = el.scrollHeight - window.innerHeight;
      scrollT = max > 0 ? window.scrollY / max : 0;
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const easeIO = (t: number) => {
      t = Math.max(0, Math.min(1, t));
      return t * t * t * (t * (t * 6 - 15) + 10);
    };

    function spr(cur: number, vel: number, target: number, k: number, d: number) {
      const f = (target - cur) * k;
      const nv = vel * d + f;
      return { val: cur + nv, vel: nv };
    }

    const dots = document.querySelectorAll('.phase-dot');
    const phLabel = document.getElementById('phase-label');
    let lastPhIdx = -1;

    function updateHUD(phIdx: number) {
      if (phIdx === lastPhIdx) return;
      lastPhIdx = phIdx;
      dots.forEach((d, j) => {
        d.classList.toggle('active', j === phIdx);
      });
      if (phLabel) phLabel.textContent = PHASES[Math.min(phIdx, PHASES.length - 1)];
      if (phIdx > 0) hintEl?.classList.add('gone');
    }

    const cam = { x: 0, y: 0, z: 10, lx: 0, ly: 0 };
    const camV = { x: 0, y: 0, z: 0 };
    let loadingTimeoutId: number;

    const tick = () => {
      const t = 0;

      if (loaded < N) {
        renderer.render(scene, camera);
        loadingTimeoutId = window.setTimeout(tick, 16);
        return;
      }

      syncScrollProgress();
      smoothT = scrollT;

      const pb = smoothT * 4;
      const phIdx = Math.min(Math.floor(pb + 0.1), 4);
      updateHUD(phIdx);

      let ctX, ctY, ctZ, lookY;

      if (pb < 1) {
        ctX = Math.sin(t * 0.11) * 0.7;
        ctY = Math.cos(t * 0.08) * 0.35;
        ctZ = 10;
        lookY = 0;
      } else if (pb < 2) {
        const f = easeIO(pb - 1);
        ctX = Math.sin(t * 0.07) * 0.4;
        ctY = lerp(0, 0.5, f);
        ctZ = lerp(10, 9, f);
        lookY = lerp(0, 0.3, f);
      } else if (pb < 3) {
        const f = easeIO(pb - 2);
        const orb = f * 0.7;
        ctX = Math.sin(orb) * 4.5;
        ctZ = Math.cos(orb) * 4.5 + 7;
        ctY = lerp(0.5, 1.8, f);
        lookY = lerp(0.3, 0.6, f);
      } else if (pb < 4) {
        const f = easeIO(pb - 3);
        ctX = lerp(Math.sin(0.7) * 4.5, 0, f);
        ctZ = lerp(Math.cos(0.7) * 4.5 + 7, 9.5, f);
        ctY = lerp(1.8, 1.4, f);
        lookY = lerp(0.6, 1.5, f);
      } else {
        ctX = Math.sin(t * 0.045) * 1.8;
        ctZ = 9.5;
        ctY = 1.4;
        lookY = 1.5;
      }

      let r;
      r = spr(cam.x, camV.x, ctX, 0.038, 0.88); cam.x = r.val; camV.x = r.vel;
      r = spr(cam.y, camV.y, ctY, 0.038, 0.88); cam.y = r.val; camV.y = r.vel;
      r = spr(cam.z, camV.z, ctZ, 0.038, 0.88); cam.z = r.val; camV.z = r.vel;

      camera.position.set(cam.x, cam.y, cam.z);
      camera.lookAt(0, lookY || 0, 0);

      cards.forEach((card) => {
        if (!card) return;
        const i = card.i;

        let phase = Math.floor(pb);
        const frac = easeIO(pb - phase);
        phase = Math.min(phase, 3);

        const positions = [posScatter(i), posLine(i), posCircle(i), posArc(i), posGallery(i)];

        const rots = [
          rotScatter(i),
          { x: 0, y: 0, z: 0 },
          rotCircle(i),
          rotArc(i),
          { x: 0, y: (i / (N - 1) - 0.5) * 0.65, z: 0 },
        ];

        const rr = rng(i * 997 + 3);
        const fOff = rr() * Math.PI * 2;
        const wobble = Math.max(0, 1.0 - pb) * 0.22;

        const posA = positions[phase];
        const posB = positions[Math.min(phase + 1, 4)];
        const rotA = rots[phase];
        const rotB = rots[Math.min(phase + 1, 4)];

        let tx = lerp(posA.x, posB.x, frac) + Math.sin(t * 0.38 + fOff) * wobble * 0.5;
        let ty = lerp(posA.y, posB.y, frac) + Math.sin(t * 0.29 + fOff + 1) * wobble;
        let tz = lerp(posA.z, posB.z, frac);
        let trx = lerp(rotA.x, rotB.x, frac);
        let try_ = lerp(rotA.y, rotB.y, frac);
        let trz = lerp(rotA.z, rotB.z, frac);

        if (pb > 3.6) {
          const gf = Math.min(1, (pb - 3.6) / 0.4);
          const spinOffset = t * 0.055 * gf;
          const gp = posGallery(i, spinOffset);
          tx = lerp(tx, gp.x, gf);
          ty = lerp(ty, gp.y, gf);
          tz = lerp(tz, gp.z, gf);
          const gRotY = (i / (N - 1) - 0.5) * 0.65 + spinOffset;
          try_ = lerp(try_, gRotY, gf);
        }

        const targetScale = pb < 2.5 ? 1.0 : lerp(1.0, 1.14, (pb - 2.5) / 1.5);

        const k = pb < 0.5 ? 0.032 : 0.062;
        const d = 0.87;

        let rx;
        rx = spr(card.cx, card.vx, tx, k, d); card.cx = rx.val; card.vx = rx.vel;
        rx = spr(card.cy, card.vy, ty, k, d); card.cy = rx.val; card.vy = rx.vel;
        rx = spr(card.cz, card.vz, tz, k, d); card.cz = rx.val; card.vz = rx.vel;
        rx = spr(card.crx, card.vrx, trx, k, d); card.crx = rx.val; card.vrx = rx.vel;
        rx = spr(card.cry, card.vry, try_, k, d); card.cry = rx.val; card.vry = rx.vel;
        rx = spr(card.crz, card.vrz, trz, k, d); card.crz = rx.val; card.vrz = rx.vel;
        rx = spr(card.csx, card.vsx, targetScale, 0.08, 0.85); card.csx = rx.val; card.vsx = rx.vel;

        card.mesh.position.set(card.cx, card.cy, card.cz);
        card.mesh.rotation.set(card.crx, card.cry, card.crz);
        card.mesh.scale.setScalar(card.csx);
      });

      renderer.render(scene, camera);
    };

    tick();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(loadingTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [threeLoaded]);

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.min.js" 
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />

      <Link href="/gallery" id="back" className="showcase-back-link">
        - Gallery
      </Link>

      <div id="phases">
        <div className="phase-dot active" data-ph="0"></div>
        <div className="phase-dot" data-ph="1"></div>
        <div className="phase-dot" data-ph="2"></div>
        <div className="phase-dot" data-ph="3"></div>
        <div className="phase-dot" data-ph="4"></div>
      </div>

      <div id="phase-label">Scatter</div>

      <div id="scroll-driver">
        <div id="sticky">
          <canvas id="c"></canvas>
          <div id="hud"></div>
        </div>
      </div>

      <div id="hint">
        <div className="bar"></div>
        <span>Scroll</span>
      </div>

      <div id="loading">
        <div id="loading-ring"></div>
      </div>

      <style jsx global>{`
        body {
          background: #06060a !important;
          overflow-y: auto !important;
        }

        .showcase-back-link {
          position: fixed;
          top: 28px;
          left: 36px;
          font-size: var(--type-caption);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          text-decoration: none;
          pointer-events: all;
          z-index: 20;
          transition: color .3s;
        }

        .showcase-back-link:hover {
          color: #0075de;
        }

        #scroll-driver {
          height: 500vh;
          position: relative;
        }

        #sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
        }

        #c {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        #hud {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        #phases {
          position: fixed;
          right: 32px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 20;
          pointer-events: none;
        }

        .phase-dot {
          width: 5px;
          height: 5px;
          border-radius: var(--radius);
          background: rgba(255,255,255,0.2);
          transition: background .5s, transform .5s;
        }

        .phase-dot.active {
          background: rgba(255,255,255,0.85);
          transform: scale(1.5);
        }

        #phase-label {
          position: fixed;
          bottom: 44px;
          left: 50%;
          transform: translateX(-50%);
          font-size: var(--type-micro);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          transition: opacity .6s;
        }

        #hint {
          position: fixed;
          bottom: 72px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          opacity: 1;
          transition: opacity 1s ease;
        }

        #hint span {
          font-size: var(--type-micro);
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }

        #hint .bar {
          width: 1px;
          height: 36px;
          background: linear-gradient(to bottom, rgba(255,255,255,.45) 0%, transparent 100%);
          animation: barPulse 2s ease-in-out infinite;
        }

        @keyframes barPulse {
          0%, 100% { opacity: .25; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }

        #hint.gone {
          opacity: 0;
          pointer-events: none;
        }

        #loading {
          position: fixed;
          inset: 0;
          background: #06060a;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          transition: opacity 1s ease;
        }

        #loading.out {
          opacity: 0;
          pointer-events: none;
        }

        #loading-ring {
          width: 32px;
          height: 32px;
          border: 1.5px solid rgba(255,255,255,0.12);
          border-top-color: rgba(255,255,255,0.6);
          border-radius: var(--radius);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
