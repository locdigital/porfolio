import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';
import { BookOpen, Dumbbell, FolderOpen, Globe2, Laptop, Languages, MapPin, Music, Play, Sparkles, SkipBack, SkipForward, Trees, Utensils } from 'lucide-react';

interface DraggableCollageProps {
  portraitSrc?: string;
}

// ----------------------------------------------------
// DYNAMIC VELOCITY-BASED DRAGGABLE CARD COMPONENT
// ----------------------------------------------------
interface CardProps {
  id: string;
  children: React.ReactNode;
  className: string;
  style?: React.CSSProperties;
  dragConstraints: React.RefObject<HTMLDivElement | null>;
  initialRotate: number;
  initialScale?: number;
  savedPosition?: { x: number; y: number };
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPointerDown?: () => void;
  zIndex?: number;
  noShadow?: boolean;
  revealDelay?: number;
}

function DraggableCard({ 
  id,
  children, 
  className, 
  style = {}, 
  dragConstraints, 
  initialRotate,
  initialScale = 1,
  savedPosition,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  zIndex = 1,
  noShadow = false,
  revealDelay = 0
}: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const { x: initialX = 0, y: initialY = 0, ...restStyle } = style as React.CSSProperties & {
    x?: number;
    y?: number;
  };
  const rotate = initialRotate;
  
  // Track dragging state to prevent link clicking during drag
  const isDraggingRef = useRef(false);

  useEffect(() => {
    x.set(savedPosition?.x ?? initialX);
    y.set(savedPosition?.y ?? initialY);
  }, [initialX, initialY, savedPosition?.x, savedPosition?.y, x, y]);

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      onDragStart={() => {
        isDraggingRef.current = true;
        onDragStart?.();
      }}
      onDragEnd={() => {
        onPositionChange?.(id, { x: x.get(), y: y.get() });
        onDragEnd?.();
        // Reset dragging state shortly after drag ends so click handlers intercept it first
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 80);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onClickCapture={(e) => {
        if (isDraggingRef.current) {
          e.preventDefault();
          e.stopPropagation();
          isDraggingRef.current = false;
        }
      }}
      initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(12px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      style={{ ...restStyle, x, y, rotate, scale: initialScale, zIndex }}
      whileDrag={{ 
        scale: initialScale * 1.08, 
        filter: "brightness(1.03)",
        ...(noShadow ? {} : { boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.28)" }),
      }}
      whileHover={{
        scale: initialScale * 1.03,
        ...(noShadow ? {} : { boxShadow: "0 15px 30px -8px rgba(0, 0, 0, 0.12)" }),
      }}
      transition={shouldReduceMotion
        ? { duration: 0 }
        : {
            opacity: { duration: 0.72, delay: revealDelay / 1000, ease: [0.16, 1, 0.3, 1] },
            filter: { duration: 0.82, delay: revealDelay / 1000, ease: [0.16, 1, 0.3, 1] },
          }}
      className={cn("absolute cursor-grab active:cursor-grabbing select-none", className)}
    >
      {children}
    </motion.div>
  );
}

// ----------------------------------------------------
// MAIN DRAGGABLE COLLAGE
// ----------------------------------------------------
export default function DraggableCollage({ portraitSrc = "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hKiIFGGTvWeLQqSKNwarCDg0EFydvVs3BXGZR" }: DraggableCollageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }>>({});

  const keepCardPosition = (id: string, position: { x: number; y: number }) => {
    setSavedPositions(prev => ({ ...prev, [id]: position }));
  };

  // Stacking z-index tracking
  const [cardZIndices, setCardZIndices] = useState<Record<string, number>>({
    portrait: 1,
    available: 2,
    spotify: 3,
    movie: 4,
    interests: 5,
    linkedin: 6,
    resume: 7,
    notion: 8,
    learning: 9,
    clock: 10,
    folder: 12,
  });
  const [, setMaxZIndex] = useState(15);

  const bringToFront = (id: string) => {
    setMaxZIndex(prev => {
      const next = prev + 1;
      setCardZIndices(indices => ({
        ...indices,
        [id]: next
      }));
      return next;
    });
  };

  // Time clock states (Vietnam ICT - Asia/Ho_Chi_Minh)
  const [timeStr, setTimeStr] = useState('09:18:45');
  const [period, setPeriod] = useState('a.m.');

  // Spotify player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyProgress, setSpotifyProgress] = useState(125);
  const spotifyTotalSeconds = 259;

  // Cursor-following pill label
  const [cursorLabel, setCursorLabel] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const springConfig = { stiffness: 280, damping: 22, mass: 0.4 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);



  // Clock tick effect (ICT)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const parts = formatter.formatToParts(now);
      const h = parts.find(p => p.type === 'hour')?.value || '09';
      const m = parts.find(p => p.type === 'minute')?.value || '18';
      const s = parts.find(p => p.type === 'second')?.value || '45';
      const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';

      setTimeStr(`${h}:${m}:${s}`);
      setPeriod(dayPeriod.toLowerCase() === 'am' ? 'a.m.' : 'p.m.');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotify timer ticking
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSpotifyProgress(prev => {
        if (prev >= spotifyTotalSeconds) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const interestItems = [
    { label: "CrossFit", Icon: Dumbbell },
    { label: "Music", Icon: Music },
    { label: "Reading", Icon: BookOpen },
    { label: "Nature walks", Icon: Trees },
    { label: "New restaurants", Icon: Utensils },
    { label: "Japanese learner", Icon: Languages },
    { label: "AI-first", Icon: Sparkles },
  ];

  const staticVisualizer = [0.25, 0.69, 0.62, 0.41, 0.59];

  return (
    <div className="draggable-collage-container relative w-full h-[100dvh] overflow-hidden bg-secondary text-foreground select-none" style={{ fontFamily: 'var(--sans)' }}>
      
      {/* Defined color variables + visualizer styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .draggable-collage-container {
          --background: 0 0% 98%;
          --foreground: 0 0% 8%;
          --card: 0 0% 100%;
          --card-foreground: 0 0% 8%;
          --popover: 0 0% 100%;
          --popover-foreground: 0 0% 8%;
          --primary: 0 0% 8%;
          --primary-foreground: 0 0% 98%;
          --secondary: 0 0% 94%;
          --secondary-foreground: 0 0% 8%;
          --muted: 0 0% 42%;
          --muted-foreground: 0 0% 42%;
          --accent: 222 89% 55%;
          --accent-foreground: 0 0% 98%;
          --border: 0 0% 88%;
          --input: 0 0% 88%;
          --ring: 222 89% 55%;
          --radius: 0.5rem;
          --type-micro: 0.8rem;
          --type-caption: 0.8rem;
          --type-ui: 0.875rem;
          --type-body: 0.8rem;
          --type-subhead: clamp(1.375rem, 2.2vw, 1.625rem);
          --type-data: 1.875rem;
          --type-display-lg: clamp(3rem, 7vw, 5.75rem);
          --type-display-xl: clamp(3rem, 6.5vw, 6rem);
        }

        .collage-headline {
          font-size: 7rem;
          line-height: 0.88;
          letter-spacing: -0.015em;
        }

        .collage-card-label {
          font-family: var(--sans);
          font-size: 14px;
          line-height: 1.35;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
        }

        @media (min-width: 1800px) {
          .collage-headline {
            font-size: 7.8rem;
          }
        }

        @media (max-width: 1200px) {
          .collage-headline {
            font-size: 5.4rem;
          }
        }

        @keyframes soundwave-bounce {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1.15); }
        }
        .sound-animate-0 { animation: soundwave-bounce 1.8s ease-in-out infinite alternate; }
        .sound-animate-1 { animation: soundwave-bounce 2.2s ease-in-out infinite alternate 0.3s; }
        .sound-animate-2 { animation: soundwave-bounce 2.6s ease-in-out infinite alternate 0.6s; }
        .sound-animate-3 { animation: soundwave-bounce 1.6s ease-in-out infinite alternate 0.1s; }
        .sound-animate-4 { animation: soundwave-bounce 2.0s ease-in-out infinite alternate 0.45s; }

        @keyframes collage-reload-fade {
          from {
            opacity: 0;
            filter: blur(12px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        .mobile-about-panel > * {
          opacity: 0;
          animation: collage-reload-fade 760ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: var(--mobile-reveal-delay, 0ms);
        }

        .mobile-about-panel {
          overflow-x: hidden;
        }

        .mobile-about-panel > *,
        .mobile-about-panel .grid,
        .mobile-about-panel .grid > * {
          min-width: 0;
        }

        .mobile-split-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 0.75rem;
          width: 100%;
        }

        @media (max-width: 520px) {
          .mobile-split-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        .mobile-about-panel > :nth-child(1) { --mobile-reveal-delay: 120ms; }
        .mobile-about-panel > :nth-child(2) { --mobile-reveal-delay: 240ms; }
        .mobile-about-panel > :nth-child(3) { --mobile-reveal-delay: 360ms; }
        .mobile-about-panel > :nth-child(4) { --mobile-reveal-delay: 480ms; }
        .mobile-about-panel > :nth-child(5) { --mobile-reveal-delay: 600ms; }
        .mobile-about-panel > :nth-child(6) { --mobile-reveal-delay: 720ms; }

        @media (prefers-reduced-motion: reduce) {
          .mobile-about-panel > * {
            opacity: 1;
            filter: none;
            animation: none;
          }
        }
      ` }} />

      {/* Grid background mesh */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.35] z-0" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px)`,
          backgroundSize: '36px 36px' 
        }} 
      />

      {/* ==============================================
          MOBILE CONTAINER (md:hidden list layout)
          ============================================== */}
      <div className="mobile-about-panel lg:hidden h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-3 px-4 pt-14 pb-8 pointer-events-auto relative z-10">
        <h2 className="max-w-[9.5ch] italic text-[clamp(2.55rem,11vw,3.15rem)] leading-[0.96] mb-2 font-light" style={{ fontFamily: 'var(--serif)' }}>
          I turn paid traffic into profit.
        </h2>

        {/* Sub-grid 1: Profile and Available status */}
        <div className="mobile-split-grid" style={{ fontFamily: 'var(--sans)' }}>
          <div className="bg-card border border-border/60 rounded-xl p-2.5 pb-6 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)] -rotate-[2deg]">
            <div className="overflow-hidden rounded-[6px] w-full">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" loading="lazy" decoding="async" draggable="false" />
            </div>
            <p className="mt-2.5 text-[var(--type-micro)] text-muted-foreground tracking-widest text-center" style={{ fontFamily: 'var(--sans)' }}>Phuc Loc · Saigon</p>
          </div>

          <div className="bg-[#BDF8D1] border border-[#4fb77a]/25 text-[#073b24] rounded-xl px-4 py-4 rotate-[1.5deg] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#073b24] opacity-40" style={{ animationDuration: '2s' }}></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#073b24]"></span>
                </span>
                <span className="collage-card-label opacity-60">Available Now</span>
              </div>
              <div className="h-px bg-[#073b24]/18 mb-2.5"></div>
              <p className="italic text-[var(--type-subhead)] leading-tight mb-2.5" style={{ fontFamily: 'var(--serif)' }}>Performance Marketer</p>
            </div>
            <div className="space-y-1" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-1.5"><MapPin className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-1.5"><Laptop className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Remote Vietnam</span></div>
              <div className="flex items-center gap-1.5"><Globe2 className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Global remote</span></div>
            </div>
          </div>
        </div>

        {/* Sub-grid 2: Music widget */}
        <div className="grid grid-cols-1 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          {/* Spotify */}
          <div className="bg-[#444444] text-background rounded-xl p-3 shadow-xl rotate-[0.5deg] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="shrink-0 w-9 h-9 rounded-[6px] overflow-hidden bg-background/10">
                <img src="https://i.ytimg.com/vi/AqM6KmEYTgU/hqdefault.jpg" alt="Vierd Blues album art" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--type-caption)] font-semibold leading-tight text-background truncate">Vierd Blues</p>
                <p className="text-[var(--type-micro)] text-background/55 truncate">Bill Evans</p>
              </div>
              <span className="inline-flex items-end gap-[2px] h-4" aria-hidden="true">
                {staticVisualizer.map((height, i) => (
                  <span
                    key={i}
                    className={cn("w-[2px] rounded-full bg-white/75 origin-bottom", isPlaying && `sound-animate-${i}`)}
                    style={{ height: '14px', transform: !isPlaying ? `scaleY(${height})` : undefined }}
                  />
                ))}
              </span>
            </div>

            {/* Slider */}
            <div className="relative h-[3px] bg-white/20 rounded-full overflow-hidden mt-1">
              <div className="absolute left-0 top-0 h-full bg-white/80 rounded-full" style={{ width: `${(spotifyProgress / spotifyTotalSeconds) * 100}%` }}></div>
            </div>
            <div className="flex justify-between" style={{ fontFamily: 'var(--mono)' }}>
              <span className="text-[var(--type-micro)] text-background/30">{formatTime(spotifyProgress)}</span>
              <span className="text-[var(--type-micro)] text-background/30">{formatTime(spotifyTotalSeconds)}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button aria-label="Previous track" className="text-background/40 transition-colors hover:text-background/70">
                <SkipBack size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <a
                href="https://www.youtube.com/watch?v=AqM6KmEYTgU"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Play on YouTube"
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground"
              >
                <Play size={13} strokeWidth={2} fill="currentColor" aria-hidden="true" />
              </a>
              <button aria-label="Next track" className="text-background/40 transition-colors hover:text-background/70">
                <SkipForward size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>

        </div>

        {/* Sub-grid 3: Details */}
        <div className="mobile-split-grid" style={{ fontFamily: 'var(--sans)' }}>
          <div className="bg-[#FF6B47] text-white rounded-xl px-4 py-4 -rotate-[1deg]">
            <p className="text-[var(--type-micro)] leading-snug">CrossFit before work,<br />restaurants on weekends,<br />music always on.</p>
          </div>
          <div className="bg-accent text-accent-foreground rounded-xl px-4 py-4 rotate-[2deg]">
            <p className="collage-card-label text-accent-foreground/60 mb-1.5">Currently Building</p>
            <p className="text-[var(--type-micro)] leading-snug font-normal">This demo site.<br /><span className="text-accent-foreground/70">(meta, right?)</span></p>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-card border border-border/60 rounded-xl px-4 py-3.5 shadow-card -rotate-[0.5deg]">
          <p className="collage-card-label text-muted-foreground mb-2.5">Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {interestItems.map(({ label, Icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[var(--type-micro)] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>
                <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Writings Folder */}
        <div className="flex flex-col items-center mt-4">
          <a href="/blog" className="grid size-11 place-items-center bg-amber-600 text-white rounded-xl shadow-lg" style={{ fontFamily: 'var(--sans)' }} aria-label="View writings">
            <FolderOpen size={17} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </div>


      {/* ==============================================
          DESKTOP CONTAINER (physics drag canvas)
          ============================================== */}
      <div 
        ref={containerRef}
        className="hidden lg:block absolute inset-0 z-10 overflow-hidden w-full h-full"
        style={{ cursor: 'none' }}
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            cursorX.set(e.clientX - rect.left);
            cursorY.set(e.clientY - rect.top);
          }
        }}
        onMouseEnter={() => setCursorVisible(true)}
        onMouseLeave={() => { setCursorVisible(false); setCursorLabel(''); }}
      >
        {/* Background Center Header */}
        <motion.div
          className="absolute inset-0 z-0 flex flex-col items-center justify-center px-8 -translate-y-[4%] pointer-events-none"
          initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={shouldReduceMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 0.86, delay: 0.18, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: 0.92, delay: 0.18, ease: [0.16, 1, 0.3, 1] },
              }}
        >
          <h2 className="collage-headline italic text-center whitespace-nowrap font-light" style={{ fontFamily: 'var(--serif)' }}>
            I turn paid traffic into profit.
          </h2>
        </motion.div>

        {/* Cursor-following pill label */}
        <motion.div
          className="absolute top-0 left-0 pointer-events-none z-[500]"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            opacity: cursorVisible ? 1 : 0,
            scale: cursorVisible ? 1 : 0.75,
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div
            className="rounded-full px-4 py-1.5 font-medium whitespace-nowrap shadow-lg text-white"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: '13px',
              background: '#0075de',
            }}
          >
            {cursorLabel || 'drag me ✦'}
          </div>
        </motion.div>


        {/* -------------------- DYNAMIC DRAGGABLE CARDS -------------------- */}

        {/* 1. Portrait Card */}
        <DraggableCard
          id="portrait"
          dragConstraints={containerRef}
          initialRotate={-5}
          savedPosition={savedPositions.portrait}
          onPositionChange={keepCardPosition}
          className="top-[10%] left-[15%]"
          onPointerDown={() => bringToFront('portrait')}
          zIndex={cardZIndices.portrait}
          onMouseEnter={() => setCursorLabel("that's me 👋")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={280}
        >
          <div className="bg-card border border-border/60 rounded-xl p-3 pb-8 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)]">
            <div className="overflow-hidden rounded-[6px] w-[160px]">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" loading="lazy" decoding="async" draggable="false" />
            </div>
            <p className="mt-3 text-[var(--type-caption)] text-muted-foreground tracking-widest text-center" style={{ fontFamily: 'var(--sans)' }}>Phuc Loc · Saigon</p>
          </div>
        </DraggableCard>

        {/* 2. Available status Card */}
        <DraggableCard
          id="available"
          dragConstraints={containerRef}
          initialRotate={4}
          savedPosition={savedPositions.available}
          onPositionChange={keepCardPosition}
          className="top-[8%] right-[7%]"
          onPointerDown={() => bringToFront('available')}
          zIndex={cardZIndices.available}
          onMouseEnter={() => setCursorLabel("let's work together ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={580}
        >
          <div className="bg-[#BDF8D1] border border-[#4fb77a]/25 text-[#073b24] rounded-xl px-6 py-5 w-[198px] shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#073b24] opacity-40" style={{ animationDuration: '2s' }}></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#073b24]"></span>
              </span>
              <span className="collage-card-label opacity-60">Available Now</span>
            </div>
            <div className="h-px bg-[#073b24]/18 mb-3"></div>
            <p className="italic text-[var(--type-subhead)] leading-tight mb-3" style={{ fontFamily: 'var(--serif)' }}>Performance Marketer</p>
            <div className="space-y-1.5" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-2"><MapPin className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-2"><Laptop className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Remote Vietnam</span></div>
              <div className="flex items-center gap-2"><Globe2 className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="text-[var(--type-micro)]">Global remote</span></div>
            </div>
          </div>
        </DraggableCard>

        {/* 3. Spotify Music Player */}
        <DraggableCard
          id="spotify"
          dragConstraints={containerRef}
          initialRotate={-2}
          savedPosition={savedPositions.spotify}
          onPositionChange={keepCardPosition}
          className="top-[10%] left-[36%]"
          onPointerDown={() => bringToFront('spotify')}
          zIndex={cardZIndices.spotify}
          onMouseEnter={() => setCursorLabel("currently vibing 🎵")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={380}
        >
          <div className="bg-[#444444] text-background rounded-xl p-4 w-[244px] shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-[6px] overflow-hidden bg-background/10">
                <img src="https://i.ytimg.com/vi/AqM6KmEYTgU/hqdefault.jpg" alt="Vierd Blues album art" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--sans)' }}>
                <p className="text-[var(--type-caption)] font-semibold leading-tight text-background truncate">Vierd Blues</p>
                <p className="text-[var(--type-micro)] text-background/55 truncate">Bill Evans</p>
              </div>
              
              {/* Audio wave */}
              <span className="inline-flex items-end gap-[2px] h-4" aria-hidden="true">
                {staticVisualizer.map((height, i) => (
                  <span 
                    key={i} 
                    className={cn("w-[2px] rounded-full bg-white/75 origin-bottom", isPlaying && `sound-animate-${i}`)} 
                    style={{ height: '14px', transform: !isPlaying ? `scaleY(${height})` : undefined }} 
                  />
                ))}
              </span>
            </div>
            
            {/* Slider */}
            <div className="relative h-[3px] bg-white/20 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-white/80 rounded-full" style={{ width: `${(spotifyProgress / spotifyTotalSeconds) * 100}%` }}></div>
            </div>
            <div className="flex justify-between mt-1.5" style={{ fontFamily: 'var(--mono)' }}>
              <span className="text-[var(--type-micro)] text-background/30">{formatTime(spotifyProgress)}</span>
              <span className="text-[var(--type-micro)] text-background/30">{formatTime(spotifyTotalSeconds)}</span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-5 mt-2.5">
              <button aria-label="Previous track" className="text-background/40 hover:text-background/70 transition-colors">
                <SkipBack size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <a
                href="https://www.youtube.com/watch?v=AqM6KmEYTgU"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Play on YouTube"
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground text-[var(--type-caption)] hover:scale-105 transition-transform"
              >
                <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden="true" />
              </a>
              <button aria-label="Next track" className="text-background/40 hover:text-background/70 transition-colors">
                <SkipForward size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
        </DraggableCard>

        {/* 4. Movie poster Card */}
        <DraggableCard
          id="movie"
          dragConstraints={containerRef}
          initialRotate={3}
          savedPosition={savedPositions.movie}
          onPositionChange={keepCardPosition}
          className="bottom-[8%] left-[57%]"
          onPointerDown={() => bringToFront('movie')}
          zIndex={cardZIndices.movie}
          onMouseEnter={() => setCursorLabel("still watching 🎬")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={1180}
        >
          <div className="bg-card border border-border/60 rounded-xl p-4 w-[180px] shadow-sm">
            <p className="collage-card-label text-muted-foreground mb-2.5">Currently Watching</p>
            <div className="w-full rounded-[6px] overflow-hidden mb-3" style={{ aspectRatio: '2 / 3' }}>
              <img src="https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hKHp72avWeLQqSKNwarCDg0EFydvVs3BXGZR5" alt="The Wolf of Wall Street movie poster" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[82%] bg-foreground/50 rounded-full"></div>
              </div>
              <span className="text-[var(--type-micro)] text-muted-foreground" style={{ fontFamily: 'var(--sans)' }}>82%</span>
            </div>
          </div>
        </DraggableCard>

        {/* 5. Interests Card */}
        <DraggableCard
          id="interests"
          dragConstraints={containerRef}
          initialRotate={3}
          savedPosition={savedPositions.interests}
          onPositionChange={keepCardPosition}
          className="bottom-[6%] left-[24%]"
          onPointerDown={() => bringToFront('interests')}
          zIndex={cardZIndices.interests}
          onMouseEnter={() => setCursorLabel("yes, all of these ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={980}
        >
          <div className="bg-card border border-border/60 rounded-xl px-6 py-5 shadow-card w-[250px]">
            <p className="collage-card-label text-muted-foreground mb-3">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {interestItems.map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[var(--type-micro)] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>
                  <Icon size={11} strokeWidth={1.8} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </DraggableCard>

        {/* 6. LinkedIn Card */}
        <DraggableCard
          id="linkedin"
          dragConstraints={containerRef}
          initialRotate={-4}
          savedPosition={savedPositions.linkedin}
          onPositionChange={keepCardPosition}
          className="bottom-[8%] right-[7%]"
          onPointerDown={() => bringToFront('linkedin')}
          zIndex={cardZIndices.linkedin}
          onMouseEnter={() => setCursorLabel("find me here ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={1280}
        >
          <a href="https://www.linkedin.com/in/phucloc/" target="_blank" rel="noopener noreferrer" draggable="false" className="block border border-white/30 rounded-xl px-5 py-4 w-[190px] shadow-lg hover:opacity-95 transition-all text-white bg-[#0a66c2]" style={{ fontFamily: 'var(--sans)' }}>
            <p className="collage-card-label text-white/60 mb-2">Find Me Online</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              <p className="text-[var(--type-caption)] font-normal leading-snug">LinkedIn<br /><span className="text-white/70 text-[var(--type-micro)]">/in/phucloc</span></p>
            </div>
          </a>
        </DraggableCard>

        {/* 7. Resume CV Card */}
        <DraggableCard
          id="resume"
          dragConstraints={containerRef}
          initialRotate={3}
          savedPosition={savedPositions.resume}
          onPositionChange={keepCardPosition}
          className="top-[47%] right-[5%]"
          onPointerDown={() => bringToFront('resume')}
          zIndex={cardZIndices.resume}
          onMouseEnter={() => setCursorLabel("download CV ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={780}
        >
          <a href="/resume" target="_blank" rel="noopener noreferrer" draggable="false" className="block bg-[#FFE45C] border border-[#3a2e00]/15 text-[#3a2e00] rounded-2xl px-5 py-4 w-[180px] shadow-lg hover:opacity-95 transition-all select-none" style={{ fontFamily: 'var(--sans)' }}>
            <p className="collage-card-label opacity-40 mb-3 text-[11px] uppercase tracking-wider font-semibold">CV</p>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0 opacity-80"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
              <div className="leading-tight">
                <span className="font-semibold text-[14px] block">Resume</span>
                <span className="opacity-50 text-[11px] block mt-0.5">PDF · 1 page</span>
              </div>
            </div>
          </a>
        </DraggableCard>

        {/* 8. Book a Call Card */}
        <DraggableCard
          id="notion"
          dragConstraints={containerRef}
          initialRotate={-3}
          savedPosition={savedPositions.notion}
          onPositionChange={keepCardPosition}
          className="top-[17%] right-[30%]"
          onPointerDown={() => bringToFront('notion')}
          zIndex={cardZIndices.notion}
          onMouseEnter={() => setCursorLabel("let's talk ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={480}
        >
          <a href="mailto:hi@loc.digital" draggable="false" className="block bg-foreground text-background rounded-xl px-5 py-4 w-[190px] shadow-lg hover:opacity-95 transition-all" style={{ fontFamily: 'var(--sans)' }}>
            <p className="collage-card-label text-background/50 mb-2">Open To Work</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
              <p className="text-[var(--type-caption)] font-normal leading-snug">Email me<br /><span className="text-background/60 text-[var(--type-micro)]">hi@loc.digital</span></p>
            </div>
          </a>
        </DraggableCard>

        {/* 9. Currently Learning Card */}
        <DraggableCard
          id="learning"
          dragConstraints={containerRef}
          initialRotate={5}
          savedPosition={savedPositions.learning}
          onPositionChange={keepCardPosition}
          className="top-[63%] left-[6%]"
          onPointerDown={() => bringToFront('learning')}
          zIndex={cardZIndices.learning}
          onMouseEnter={() => setCursorLabel("still learning ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={880}
        >
          <div className="bg-[#FFF3CD] border border-[#F0C040]/40 text-[#7a5c00] rounded-xl px-4 py-3 w-[170px] shadow-sm" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[var(--type-micro)] leading-snug">
              Currently learning<br />
              <span className="inline-flex items-center gap-1.5 text-[var(--type-caption)] font-normal">
                <Languages size={11} strokeWidth={1.8} aria-hidden="true" />
                Japanese for fun
              </span>
            </p>
          </div>
        </DraggableCard>

        {/* 10. Digital Timezone Clock Card */}
        <DraggableCard
          id="clock"
          dragConstraints={containerRef}
          initialRotate={-3}
          style={{ x: 30.5, y: -12.5 }}
          savedPosition={savedPositions.clock}
          onPositionChange={keepCardPosition}
          className="top-[44%] left-[6%]"
          onPointerDown={() => bringToFront('clock')}
          zIndex={cardZIndices.clock}
          onMouseEnter={() => setCursorLabel("Saigon time 🕐")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={680}
        >
          <div className="bg-card border border-border/60 rounded-xl px-5 py-4 shadow-card w-fit whitespace-nowrap">
            <p className="collage-card-label text-muted-foreground mb-2">Saigon, VN</p>
            <div className="flex items-end gap-1.5">
              <span className="text-[var(--type-data)] font-bold leading-none tracking-tight tabular-nums" style={{ fontFamily: 'var(--mono)' }}>
                {timeStr}
              </span>
              <span className="collage-card-label text-foreground/40 mb-1">{period}</span>
            </div>
            <p className="text-[var(--type-micro)] text-muted-foreground mt-1.5" style={{ fontFamily: 'var(--mono)' }}>ICT · UTC+7</p>
          </div>
        </DraggableCard>

        {/* 12. My writings folder card */}
        <DraggableCard
          id="folder"
          dragConstraints={containerRef}
          initialRotate={-2}
          initialScale={0.5}
          savedPosition={savedPositions.folder}
          onPositionChange={keepCardPosition}
          className="bottom-[24%] left-[42%] flex flex-col items-center group origin-bottom"
          onPointerDown={() => bringToFront('folder')}
          zIndex={cardZIndices.folder}
          noShadow
          onMouseEnter={() => setCursorLabel("read my writings ✦")}
          onMouseLeave={() => setCursorLabel('')}
          revealDelay={1080}
        >
          <a className="file relative w-60 h-40 cursor-pointer [perspective:1500px] z-50 block" href="/blog" draggable="false">
            {/* Folder background */}
            <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none transition-all duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%)]"></div>
            
            {/* Sheet 4 */}
            <div className="work-4 absolute inset-1 bg-white rounded-2xl border border-zinc-200 transition-all duration-[500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom select-none group-hover:[transform:translate(-14px,-30px)_rotate(-7deg)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-3/4 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-5/6 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Sheet 3 */}
            <div className="work-3 absolute inset-1 bg-white rounded-2xl border border-zinc-200 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom group-hover:[transform:translate(14px,-45px)_rotate(5deg)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-2/3 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-3/4 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Sheet 2 */}
            <div className="work-2 absolute inset-1 bg-white rounded-2xl border border-zinc-200 transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom group-hover:[transform:translate(-4px,-65px)_rotate(-3deg)_scale(1.02)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-4/5 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-2/3 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Front flap */}
            <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] transition-all duration-300 origin-bottom flex items-end group-hover:[transform:rotateX(-46deg)_translateY(1px)]"></div>
          </a>
        </DraggableCard>

        {/* -------------------- END DYNAMIC CARDS -------------------- */}

      </div>
    </div>
  );
}
