import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FolderOpen, Globe2, Laptop, MapPin, Pause, Play, SkipBack, SkipForward } from 'lucide-react';

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
  zIndex = 1
}: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
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
      style={{ ...restStyle, x, y, rotate, scale: initialScale, zIndex }}
      whileDrag={{ 
        scale: initialScale * 1.08, 
        filter: "brightness(1.03)",
        boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.28)",
      }}
      whileHover={{
        scale: initialScale * 1.03,
        boxShadow: "0 15px 30px -8px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ duration: 0 }}
      className={cn("absolute cursor-grab active:cursor-grabbing select-none", className)}
    >
      {children}
    </motion.div>
  );
}

// ----------------------------------------------------
// MAIN DRAGGABLE COLLAGE
// ----------------------------------------------------
export default function DraggableCollage({ portraitSrc = "/himmel-vua.jpeg" }: DraggableCollageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionStorageKey = 'loc-draggable-collage-positions-v2';
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(positionStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setSavedPositions(parsed);
      }
    } catch {
      window.localStorage.removeItem(positionStorageKey);
    }
  }, []);

  const keepCardPosition = (id: string, position: { x: number; y: number }) => {
    setSavedPositions(prev => {
      const next = { ...prev, [id]: position };
      try {
        window.localStorage.setItem(positionStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
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
    rating: 11,
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

  // Star ratings
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);



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
          --type-micro: 14px;
          --type-caption: 14px;
          --type-ui: 0.875rem;
          --type-body: 14px;
          --type-subhead: 14px;
          --type-data: 1.375rem;
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

        .collage-card-text {
          font-family: var(--sans);
          font-size: 14px;
          line-height: 1.4;
          font-weight: 400;
          letter-spacing: 0;
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
        .sound-animate-0 { animation: soundwave-bounce 0.9s ease-in-out infinite alternate; }
        .sound-animate-1 { animation: soundwave-bounce 0.7s ease-in-out infinite alternate 0.15s; }
        .sound-animate-2 { animation: soundwave-bounce 1.1s ease-in-out infinite alternate 0.3s; }
        .sound-animate-3 { animation: soundwave-bounce 0.6s ease-in-out infinite alternate 0.05s; }
        .sound-animate-4 { animation: soundwave-bounce 0.8s ease-in-out infinite alternate 0.2s; }
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
      <div className="mobile-about-panel md:hidden h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-3 px-4 pt-14 pb-8 pointer-events-auto relative z-10">
        <h2 className="italic text-[var(--type-display-lg)] leading-[1.05] mb-2 font-light" style={{ fontFamily: 'var(--serif)' }}>
          I turn paid traffic into profit.
        </h2>

        {/* Sub-grid 1: Profile and Available status */}
        <div className="grid grid-cols-2 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          <div className="bg-card border border-border/60 rounded-xl p-2.5 pb-6 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)] -rotate-[2deg]">
            <div className="overflow-hidden rounded-lg w-full">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" loading="lazy" decoding="async" draggable="false" />
            </div>
            <p className="mt-2.5 collage-card-text text-muted-foreground text-center">Phuc Loc · Saigon</p>
          </div>

          <div className="bg-[#4ECCA3] border border-white/40 text-[#0a2e22] rounded-xl px-4 py-4 rotate-[1.5deg] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a2e22] opacity-40"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0a2e22]"></span>
                </span>
                <span className="collage-card-label opacity-60">Available Now</span>
              </div>
              <div className="h-px bg-[#0a2e22]/20 mb-2.5"></div>
              <p className="collage-card-text mb-2.5">Performance Marketer</p>
            </div>
            <div className="space-y-1" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-1.5"><MapPin className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-1.5"><Laptop className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Remote Vietnam</span></div>
              <div className="flex items-center gap-1.5"><Globe2 className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Global remote</span></div>
            </div>
          </div>
        </div>

        {/* Sub-grid 2: Music widget and Star rate */}
        <div className="grid grid-cols-2 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          {/* Spotify */}
          <div className="bg-foreground text-background rounded-2xl p-3 shadow-xl rotate-[0.5deg] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden">
                <img src="/images/X_cover.webp" alt="Photograph" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--type-micro)] font-normal text-background truncate">Photograph</p>
                <p className="text-[var(--type-micro)] text-background/50 truncate">Ed Sheeran</p>
              </div>
            </div>
            
            {/* Audio wave */}
            <span className="inline-flex items-end gap-[2px] h-3">
              {staticVisualizer.map((height, i) => (
                <span 
                  key={i} 
                  className={cn("w-[2px] rounded-full bg-white/70 origin-bottom", isPlaying && `sound-animate-${i}`)} 
                  style={{ height: '12px', transform: !isPlaying ? `scaleY(${height})` : undefined }} 
                />
              ))}
            </span>

            {/* Slider */}
            <div className="relative h-[3px] bg-white/20 rounded-full overflow-hidden">
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
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                aria-label={isPlaying ? "Pause" : "Play"} 
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground"
              >
                {isPlaying ? <Pause size={13} strokeWidth={2} fill="currentColor" aria-hidden="true" /> : <Play size={13} strokeWidth={2} fill="currentColor" aria-hidden="true" />}
              </button>
              <button aria-label="Next track" className="text-background/40 transition-colors hover:text-background/70">
                <SkipForward size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="-rotate-[1deg]">
            <div className="relative">
              <div className="bg-card border border-border/60 rounded-xl px-4 py-4 shadow-card w-full">
                <p className="collage-card-label text-muted-foreground mb-3">Rate This Portfolio</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isFilled = starIdx <= (hoveredRating || rating);
                    return (
                      <button 
                        key={starIdx}
                        onMouseEnter={() => setHoveredRating(starIdx)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(starIdx)}
                        className="leading-none transition-transform duration-100 hover:scale-125 cursor-pointer" 
                        aria-label={`Rate ${starIdx} stars`}
                      >
                        <span style={{ display: 'inline-block', transform: 'none' }}>
                          <span className="relative inline-block w-6 h-6" style={{ color: '#FABE15' }}>
                            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full transition-opacity duration-200" style={{ fill: 'currentColor' }}>
                              <path d={isFilled ? "M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5Z" : "M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5ZM12 4.75L14 9.33L18.7 9.75L15 13.07L16.18 17.75L12 15.16L7.82 17.75L9 13.07L5.3 9.75L10 9.33L12 4.75Z"}></path>
                            </svg>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-grid 3: Details */}
        <div className="grid grid-cols-2 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          <div className="bg-[#FF6B47] text-white rounded-xl px-4 py-4 -rotate-[1deg]">
            <p className="collage-card-text">CrossFit before work,<br />restaurants on weekends,<br />music always on.</p>
          </div>
          <div className="bg-accent text-accent-foreground rounded-xl px-4 py-4 rotate-[2deg]">
            <p className="collage-card-label text-accent-foreground/60 mb-1.5">Currently Building</p>
            <p className="collage-card-text">This demo site.<br /><span className="text-accent-foreground/70">(meta, right?)</span></p>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-card border border-border/60 rounded-xl px-4 py-3.5 shadow-card -rotate-[0.5deg]">
          <p className="collage-card-label text-muted-foreground mb-2.5">Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {["CrossFit", "Music", "Reading", "Nature walks", "New restaurants", "Japanese learner", "AI-first"].map((interest, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border border-border text-[var(--type-micro)] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>{interest}</span>
            ))}
          </div>
        </div>

        {/* Writings Folder */}
        <div className="flex flex-col items-center mt-4">
          <a href="/blog" className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl shadow-lg text-[var(--type-caption)]" style={{ fontFamily: 'var(--sans)' }}>
            <FolderOpen size={15} strokeWidth={1.8} aria-hidden="true" /> View My Writings
          </a>
        </div>
      </div>


      {/* ==============================================
          DESKTOP CONTAINER (physics drag canvas)
          ============================================== */}
      <div 
        ref={containerRef}
        className="hidden md:block absolute inset-0 z-10 overflow-hidden w-full h-full"
      >
        {/* Background Center Header */}
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-8 -translate-y-[4%] pointer-events-none">
          <h2 className="collage-headline italic text-center whitespace-nowrap font-light" style={{ fontFamily: 'var(--serif)' }}>
            I turn paid traffic into profit.
          </h2>
        </div>


        {/* -------------------- DYNAMIC DRAGGABLE CARDS -------------------- */}

        {/* 1. Portrait Card */}
        <DraggableCard
          id="portrait"
          dragConstraints={containerRef}
          initialRotate={-5}
          savedPosition={savedPositions.portrait}
          onPositionChange={keepCardPosition}
          className="top-[10%] left-[5%]"
          onPointerDown={() => bringToFront('portrait')}
          zIndex={cardZIndices.portrait}
        >
          <div className="bg-card border border-border/60 rounded-xl p-3 pb-8 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)]">
            <div className="overflow-hidden rounded-lg w-[160px]">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" loading="lazy" decoding="async" draggable="false" />
            </div>
            <p className="mt-3 collage-card-text text-muted-foreground text-center">Phuc Loc · Saigon</p>
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
        >
          <div className="bg-[#4ECCA3] border border-white/40 text-[#0a2e22] rounded-xl px-6 py-5 w-[198px] shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a2e22] opacity-40"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0a2e22]"></span>
              </span>
              <span className="collage-card-label opacity-60">Available Now</span>
            </div>
            <div className="h-px bg-[#0a2e22]/20 mb-3"></div>
            <p className="collage-card-text mb-3">Performance Marketer</p>
            <div className="space-y-1.5" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-2"><MapPin className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-2"><Laptop className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Remote Vietnam</span></div>
              <div className="flex items-center gap-2"><Globe2 className="opacity-60" size={12} strokeWidth={1.8} aria-hidden="true" /><span className="collage-card-text">Global remote</span></div>
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
        >
          <div className="bg-foreground text-background rounded-2xl p-4 w-[220px] shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                <img src="/images/X_cover.webp" alt="Photograph album art" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--sans)' }}>
                <p className="text-[var(--type-caption)] font-normal text-background truncate">Photograph</p>
                <p className="text-[var(--type-micro)] text-background/50 truncate">Ed Sheeran</p>
              </div>
              
              {/* Audio wave */}
              <span className="inline-flex items-end gap-[2px] h-3">
                {staticVisualizer.map((height, i) => (
                  <span 
                    key={i} 
                    className={cn("w-[2px] rounded-full bg-white/70 origin-bottom", isPlaying && `sound-animate-${i}`)} 
                    style={{ height: '12px', transform: !isPlaying ? `scaleY(${height})` : undefined }} 
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
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                }} 
                aria-label={isPlaying ? "Pause" : "Play"} 
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground text-[var(--type-caption)] hover:scale-105 transition-transform"
              >
                  {isPlaying ? <Pause size={14} strokeWidth={2} fill="currentColor" aria-hidden="true" /> : <Play size={14} strokeWidth={2} fill="currentColor" aria-hidden="true" />}
                </button>
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
        >
          <div className="bg-card border border-border/60 rounded-xl p-4 w-[180px] shadow-sm">
            <p className="collage-card-label text-muted-foreground mb-2.5">Currently Watching</p>
            <div className="w-full rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '2 / 3' }}>
              <img src="/images/The_Wolf_of_Wall_Street_2013.webp" alt="The Wolf of Wall Street movie poster" loading="lazy" decoding="async" draggable="false" className="w-full h-full object-cover pointer-events-none" />
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
          className="bottom-[7%] left-[5%]"
          onPointerDown={() => bringToFront('interests')}
          zIndex={cardZIndices.interests}
        >
          <div className="bg-card border border-border/60 rounded-xl px-6 py-5 shadow-card w-[250px]">
            <p className="collage-card-label text-muted-foreground mb-3">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {["CrossFit", "Music", "Reading", "Nature walks", "New restaurants", "Japanese learner", "AI-first"].map((interest, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full border border-border text-[var(--type-micro)] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>{interest}</span>
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
        >
          <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" draggable="false" className="block bg-[#FFE45C] border border-[#3a2e00]/15 text-[#3a2e00] rounded-xl px-5 py-4 w-[180px] shadow-lg hover:opacity-95 transition-all" style={{ fontFamily: 'var(--sans)' }}>
            <p className="collage-card-label opacity-60 mb-2">CV</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
              <p className="text-[var(--type-caption)] font-normal leading-snug">Resume<br /><span className="opacity-60 text-[var(--type-micro)]">Web format</span></p>
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
        >
          <div className="bg-[#FFF3CD] border border-[#F0C040]/40 text-[#7a5c00] rounded-xl px-4 py-3 w-[170px] shadow-sm" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[var(--type-micro)] leading-snug">Currently learning<br /><span className="text-[var(--type-caption)] font-normal">Japanese for fun</span></p>
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

        {/* 11. Rate Portfolio Stars Card */}
        <DraggableCard
          id="rating"
          dragConstraints={containerRef}
          initialRotate={-4}
          savedPosition={savedPositions.rating}
          onPositionChange={keepCardPosition}
          className="bottom-[20%] left-[25%]"
          onPointerDown={() => bringToFront('rating')}
          zIndex={cardZIndices.rating}
        >
          <div className="bg-card border border-border/60 rounded-xl px-5 py-4 shadow-card w-full">
            <p className="collage-card-label text-muted-foreground mb-3">Rate This Portfolio</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const isFilled = starIdx <= (hoveredRating || rating);
                return (
                  <button 
                    key={starIdx}
                    onMouseEnter={() => setHoveredRating(starIdx)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(starIdx)}
                    className="leading-none transition-transform duration-100 hover:scale-125 cursor-pointer" 
                    aria-label={`Rate ${starIdx} stars`}
                  >
                    <span style={{ display: 'inline-block', transform: 'none' }}>
                      <span className="relative inline-block w-7 h-7" style={{ color: '#FABE15' }}>
                        <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full transition-opacity duration-200" style={{ fill: 'currentColor' }}>
                          <path d={isFilled ? "M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5Z" : "M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5ZM12 4.75L14 9.33L18.7 9.75L15 13.07L16.18 17.75L12 15.16L7.82 17.75L9 13.07L5.3 9.75L10 9.33L12 4.75Z"}></path>
                        </svg>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
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
        >
          <a className="file relative w-60 h-40 cursor-pointer [perspective:1500px] z-50 block" href="/blog" draggable="false">
            {/* Folder background */}
            <div className="work-5 bg-amber-600 w-full h-full origin-top rounded-2xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)] transition-all duration-300 relative after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-20 after:h-4 after:bg-amber-600 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[15px] before:left-[75.5px] before:w-4 before:h-4 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%)]"></div>
            
            {/* Sheet 4 */}
            <div className="work-4 absolute inset-1 bg-white rounded-2xl shadow-md border border-zinc-200 transition-all duration-[500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom select-none group-hover:[transform:translate(-14px,-30px)_rotate(-7deg)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-3/4 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-5/6 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Sheet 3 */}
            <div className="work-3 absolute inset-1 bg-white rounded-2xl shadow-md border border-zinc-200 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom group-hover:[transform:translate(14px,-45px)_rotate(5deg)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-2/3 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-3/4 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Sheet 2 */}
            <div className="work-2 absolute inset-1 bg-white rounded-2xl shadow-md border border-zinc-200 transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom group-hover:[transform:translate(-4px,-65px)_rotate(-3deg)_scale(1.02)] flex flex-col gap-2 p-4">
              <div className="h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden="true"></div>
              <div className="h-2.5 w-4/5 rounded-full bg-zinc-400/80 mt-1" aria-hidden="true"></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-200 mt-auto" aria-hidden="true"></div>
              <div className="h-1.5 w-2/3 rounded-full bg-zinc-200" aria-hidden="true"></div>
            </div>
            
            {/* Front flap */}
            <div className="work-1 absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[156px] rounded-2xl rounded-tr-none after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[146px] after:h-[16px] after:bg-amber-400 after:rounded-t-2xl before:absolute before:content-[''] before:-top-[10px] before:right-[142px] before:size-3 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] transition-all duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_20px_40px_#fbbf24,_inset_0_-20px_40px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"></div>
          </a>
          <p className="mt-6 collage-card-label text-muted-foreground select-none">My Writings</p>
        </DraggableCard>

        {/* -------------------- END DYNAMIC CARDS -------------------- */}

      </div>
    </div>
  );
}
