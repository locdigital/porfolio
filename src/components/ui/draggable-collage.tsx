import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useVelocity, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DraggableCollageProps {
  portraitSrc?: string;
}

// ----------------------------------------------------
// DYNAMIC VELOCITY-BASED DRAGGABLE CARD COMPONENT
// ----------------------------------------------------
interface CardProps {
  children: React.ReactNode;
  className: string;
  style?: React.CSSProperties;
  dragConstraints: React.RefObject<HTMLDivElement>;
  initialRotate: number;
  initialScale?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPointerDown?: () => void;
  zIndex?: number;
}

function DraggableCard({ 
  children, 
  className, 
  style = {}, 
  dragConstraints, 
  initialRotate,
  initialScale = 1,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  zIndex = 1
}: CardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xVelocity = useVelocity(x);
  const rotateVelocity = useTransform(xVelocity, [-3000, 3000], [-22, 22]);
  const rotateSpring = useSpring(rotateVelocity, { damping: 20, stiffness: 120 });
  const rotate = useTransform(rotateSpring, (v) => v + initialRotate);

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      dragElastic={0.22}
      dragTransition={{ power: 0.22, timeConstant: 280 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      style={{ x, y, rotate, scale: initialScale, zIndex, ...style }}
      whileDrag={{ 
        scale: initialScale * 1.08, 
        filter: "brightness(1.03)",
        boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.28)",
      }}
      whileHover={{
        scale: initialScale * 1.03,
        boxShadow: "0 15px 30px -8px rgba(0, 0, 0, 0.12)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn("absolute cursor-grab active:cursor-grabbing select-none", className)}
    >
      {children}
    </motion.div>
  );
}

// ----------------------------------------------------
// MAIN DRAGGABLE COLLAGE
// ----------------------------------------------------
export default function DraggableCollage({ portraitSrc = "/leah-portrait.jpg" }: DraggableCollageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [maxZIndex, setMaxZIndex] = useState(15);

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

  // Custom cursor variables
  const cursorX = useMotionValue(-150);
  const cursorY = useMotionValue(-150);
  const [cursorOpacity, setCursorOpacity] = useState(0);
  const [cursorText, setCursorText] = useState('grab & drag ✦');
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const cursorXSpring = useSpring(cursorX, { damping: 42, stiffness: 280 });
  const cursorYSpring = useSpring(cursorY, { damping: 42, stiffness: 280 });

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

  // Track cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const staticVisualizer = [0.25, 0.69, 0.62, 0.41, 0.59];

  // Helper callbacks to update cursor text
  const enterCard = (text: string) => () => {
    if (!isDraggingAny) setCursorText(text);
  };
  const leaveCard = () => {
    if (!isDraggingAny) setCursorText('grab & drag ✦');
  };

  const handleDragStart = () => {
    setIsDraggingAny(true);
    setCursorText('tossing ✦');
  };
  const handleDragEnd = () => {
    setIsDraggingAny(false);
    setCursorText('grab & drag ✦');
  };

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
        <h2 className="italic text-[clamp(2.2rem,11vw,5rem)] leading-[1.05] mb-2 font-light" style={{ fontFamily: 'var(--serif)' }}>
          I design and ship. Fast.
        </h2>

        {/* Sub-grid 1: Profile and Available status */}
        <div className="grid grid-cols-2 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          <div className="bg-card border border-border/60 rounded-xl p-2.5 pb-6 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)] -rotate-[2deg]">
            <div className="overflow-hidden rounded-lg w-full">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" draggable="false" />
            </div>
            <p className="mt-2.5 text-[9px] text-muted-foreground tracking-widest text-center" style={{ fontFamily: 'var(--sans)' }}>Phuc Loc · Saigon</p>
          </div>

          <div className="bg-[#4ECCA3] border border-white/40 text-[#0a2e22] rounded-xl px-4 py-4 rotate-[1.5deg] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a2e22] opacity-40"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0a2e22]"></span>
                </span>
                <span className="text-[8px] uppercase tracking-widest opacity-60" style={{ fontFamily: 'var(--mono)' }}>available now</span>
              </div>
              <div className="h-px bg-[#0a2e22]/20 mb-2.5"></div>
              <p className="italic text-lg leading-tight mb-2.5" style={{ fontFamily: 'var(--serif)' }}>Marketing Engineer</p>
            </div>
            <div className="space-y-1" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-1.5"><span className="opacity-50">→</span><span className="text-[9px]">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-1.5"><span className="opacity-50">→</span><span className="text-[9px]">Remote Vietnam</span></div>
              <div className="flex items-center gap-1.5"><span className="opacity-50">→</span><span className="text-[9px]">Global remote</span></div>
            </div>
          </div>
        </div>

        {/* Sub-grid 2: Music widget and Star rate */}
        <div className="grid grid-cols-2 gap-3" style={{ fontFamily: 'var(--sans)' }}>
          {/* Spotify */}
          <div className="bg-foreground text-background rounded-2xl p-3 shadow-xl rotate-[0.5deg] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/en/a/ad/X_cover.png" alt="Photograph" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-background truncate">Photograph</p>
                <p className="text-[9px] text-background/50 truncate">Ed Sheeran</p>
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
              <span className="text-[8px] text-background/30">{formatTime(spotifyProgress)}</span>
              <span className="text-[8px] text-background/30">{formatTime(spotifyTotalSeconds)}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button aria-label="Previous track" className="text-background/40 text-xs">⏮</button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                aria-label={isPlaying ? "Pause" : "Play"} 
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground text-xs"
              >
                {isPlaying ? "||" : "▶"}
              </button>
              <button aria-label="Next track" className="text-background/40 text-xs">⏭</button>
            </div>
          </div>

          {/* Rating */}
          <div className="-rotate-[1deg]">
            <div className="relative">
              <div className="bg-card border border-border/60 rounded-xl px-4 py-4 shadow-card w-full">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'var(--sans)' }}>rate this portfolio</p>
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
            <p className="text-[10px] leading-snug">CrossFit before work,<br />restaurants on weekends,<br />music always on.</p>
          </div>
          <div className="bg-accent text-accent-foreground rounded-xl px-4 py-4 rotate-[2deg]">
            <p className="text-[8px] uppercase tracking-widest text-accent-foreground/60 mb-1.5" style={{ fontFamily: 'var(--sans)' }}>currently building</p>
            <p className="text-[10px] leading-snug font-medium">This demo site.<br /><span className="text-accent-foreground/70 font-normal">(meta, right?)</span></p>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-card border border-border/60 rounded-xl px-4 py-3.5 shadow-card -rotate-[0.5deg]">
          <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-2.5" style={{ fontFamily: 'var(--sans)' }}>interests</p>
          <div className="flex flex-wrap gap-1.5">
            {["CrossFit", "Music", "Reading", "Nature walks", "New restaurants", "Japanese learner", "AI-first"].map((interest, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border border-border text-[9px] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>{interest}</span>
            ))}
          </div>
        </div>

        {/* Writings Folder */}
        <div className="flex flex-col items-center mt-4">
          <a href="/blog" className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl shadow-lg text-xs" style={{ fontFamily: 'var(--sans)' }}>
            📂 View My Writings
          </a>
        </div>
      </div>


      {/* ==============================================
          DESKTOP CONTAINER (physics drag canvas)
          ============================================== */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setCursorOpacity(1)}
        onMouseLeave={() => setCursorOpacity(0)}
        className="hidden md:block absolute inset-0 z-10 overflow-hidden w-full h-full"
      >
        {/* Background Center Header */}
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-8 -translate-y-[4%] pointer-events-none">
          <h2 className="italic text-[clamp(2.5rem,8vw,4.5rem)] md:text-[clamp(3rem,5.5vw,7.5rem)] leading-[1.08] text-center whitespace-nowrap font-light" style={{ fontFamily: 'var(--serif)' }}>
            I design and ship. Fast.
          </h2>
        </div>


        {/* -------------------- DYNAMIC DRAGGABLE CARDS -------------------- */}

        {/* 1. Portrait Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-5}
          className="top-[10%] left-[5%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("it's me ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('portrait')}
          zIndex={cardZIndices.portrait}
        >
          <div className="bg-card border border-border/60 rounded-xl p-3 pb-8 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)]">
            <div className="overflow-hidden rounded-lg w-[140px] md:w-[160px] 3xl:w-[200px] 4xl:w-[240px]">
              <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" draggable="false" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground tracking-widest text-center" style={{ fontFamily: 'var(--sans)' }}>Phuc Loc · Saigon</p>
          </div>
        </DraggableCard>

        {/* 2. Available status Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={4}
          className="top-[8%] right-[7%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("status ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('available')}
          zIndex={cardZIndices.available}
        >
          <div className="bg-[#4ECCA3] border border-white/40 text-[#0a2e22] rounded-xl px-5 py-5 w-[192px] 3xl:w-[240px] 4xl:w-[280px] shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a2e22] opacity-40"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0a2e22]"></span>
              </span>
              <span className="text-[9px] uppercase tracking-widest opacity-60" style={{ fontFamily: 'var(--mono)' }}>available now</span>
            </div>
            <div className="h-px bg-[#0a2e22]/20 mb-3"></div>
            <p className="italic text-xl leading-tight mb-3" style={{ fontFamily: 'var(--serif)' }}>Marketing Engineer</p>
            <div className="space-y-1.5" style={{ fontFamily: 'var(--sans)' }}>
              <div className="flex items-center gap-2"><span className="opacity-50">→</span><span className="text-[10px]">Ho Chi Minh City</span></div>
              <div className="flex items-center gap-2"><span className="opacity-50">→</span><span className="text-[10px]">Remote Vietnam</span></div>
              <div className="flex items-center gap-2"><span className="opacity-50">→</span><span className="text-[10px]">Global remote</span></div>
            </div>
          </div>
        </DraggableCard>

        {/* 3. Spotify Music Player */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-2}
          className="top-[9%] left-[36%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard(isPlaying ? "pause music ✦" : "play music ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('spotify')}
          zIndex={cardZIndices.spotify}
        >
          <div className="bg-foreground text-background rounded-2xl p-4 w-[220px] 3xl:w-[280px] 4xl:w-[320px] shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/en/a/ad/X_cover.png" alt="Photograph album art" draggable="false" className="w-full h-full object-cover pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--sans)' }}>
                <p className="text-xs font-semibold text-background truncate">Photograph</p>
                <p className="text-[10px] text-background/50 truncate">Ed Sheeran</p>
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
              <span className="text-[9px] text-background/30">{formatTime(spotifyProgress)}</span>
              <span className="text-[9px] text-background/30">{formatTime(spotifyTotalSeconds)}</span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-5 mt-2.5">
              <button aria-label="Previous track" className="text-background/40 hover:text-background/70 transition-colors text-xs">⏮</button>
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  setCursorText(!isPlaying ? "pause music ✦" : "play music ✦");
                }} 
                aria-label={isPlaying ? "Pause" : "Play"} 
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground text-xs hover:scale-105 transition-transform"
              >
                {isPlaying ? "||" : "▶"}
              </button>
              <button aria-label="Next track" className="text-background/40 hover:text-background/70 transition-colors text-xs">⏭</button>
            </div>
          </div>
        </DraggableCard>

        {/* 4. Movie poster Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={3}
          className="bottom-[9%] left-[57%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("watching movie ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('movie')}
          zIndex={cardZIndices.movie}
        >
          <div className="bg-card border border-border/60 rounded-xl p-4 w-[180px] 3xl:w-[230px] 4xl:w-[270px] shadow-sm">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2.5" style={{ fontFamily: 'var(--sans)' }}>currently watching</p>
            <div className="w-full rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '2 / 3' }}>
              <img src="https://upload.wikimedia.org/wikipedia/en/d/d8/The_Wolf_of_Wall_Street_%282013%29.png" alt="The Wolf of Wall Street movie poster" draggable="false" className="w-full h-full object-cover pointer-events-none" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[82%] bg-foreground/50 rounded-full"></div>
              </div>
              <span className="text-[9px] text-muted-foreground" style={{ fontFamily: 'var(--sans)' }}>82%</span>
            </div>
          </div>
        </DraggableCard>

        {/* 5. Interests Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={3}
          className="bottom-[8%] left-[5%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("interests ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('interests')}
          zIndex={cardZIndices.interests}
        >
          <div className="bg-card border border-border/60 rounded-xl px-5 py-4 shadow-card max-w-[250px] 3xl:max-w-[310px] 4xl:max-w-[360px]">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'var(--sans)' }}>interests</p>
            <div className="flex flex-wrap gap-1.5">
              {["CrossFit", "Music", "Reading", "Nature walks", "New restaurants", "Japanese learner", "AI-first"].map((interest, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full border border-border text-[9px] text-foreground/70" style={{ fontFamily: 'var(--sans)' }}>{interest}</span>
              ))}
            </div>
          </div>
        </DraggableCard>

        {/* 6. LinkedIn Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-4}
          className="bottom-[10%] right-[7%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("connect linkedin ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('linkedin')}
          zIndex={cardZIndices.linkedin}
        >
          <a href="https://www.linkedin.com/in/phucloc/" target="_blank" rel="noopener noreferrer" draggable="false" className="block border border-white/30 rounded-xl px-5 py-4 w-[190px] 3xl:w-[240px] 4xl:w-[280px] shadow-lg hover:opacity-95 transition-all text-white bg-[#0a66c2]" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[9px] uppercase tracking-widest text-white/60 mb-2">find me online</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              <p className="text-xs font-medium leading-snug">LinkedIn<br /><span className="text-white/70 text-[9px]">/in/phucloc</span></p>
            </div>
          </a>
        </DraggableCard>

        {/* 7. Resume CV Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={3}
          className="top-[46%] right-[5%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("open resume pdf ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('resume')}
          zIndex={cardZIndices.resume}
        >
          <a href="https://phucloc.digital/resume" target="_blank" rel="noopener noreferrer" draggable="false" className="block bg-[#FFE45C] border border-[#3a2e00]/15 text-[#3a2e00] rounded-xl px-5 py-4 w-[180px] 3xl:w-[230px] 4xl:w-[270px] shadow-lg hover:opacity-95 transition-all" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[9px] uppercase tracking-widest opacity-60 mb-2">cv</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
              <p className="text-xs font-medium leading-snug">Resume<br /><span className="opacity-60 text-[9px]">Web format</span></p>
            </div>
          </a>
        </DraggableCard>

        {/* 8. Book a Call Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-3}
          className="top-[16%] right-[30%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("email phuc loc ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('notion')}
          zIndex={cardZIndices.notion}
        >
          <a href="mailto:hi@loc.digital" draggable="false" className="block bg-foreground text-background rounded-xl px-5 py-4 w-[190px] 3xl:w-[240px] 4xl:w-[280px] shadow-lg hover:opacity-95 transition-all" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[9px] uppercase tracking-widest text-background/50 mb-2">open to work</p>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
              <p className="text-xs font-medium leading-snug">Email me<br /><span className="text-background/60 text-[9px]">hi@loc.digital</span></p>
            </div>
          </a>
        </DraggableCard>

        {/* 9. Currently Learning Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={5}
          className="top-[62%] left-[6%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("japanese for fun ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('learning')}
          zIndex={cardZIndices.learning}
        >
          <div className="bg-[#FFF3CD] border border-[#F0C040]/40 text-[#7a5c00] rounded-xl px-4 py-3 w-[170px] 3xl:w-[220px] 4xl:w-[260px] shadow-sm" style={{ fontFamily: 'var(--sans)' }}>
            <p className="text-[10px] leading-snug">Currently learning<br /><span className="text-xs font-semibold">🇯🇵 Japanese for fun</span></p>
          </div>
        </DraggableCard>

        {/* 10. Digital Timezone Clock Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-3}
          style={{ x: 30.5, y: -12.5 }}
          className="top-[44%] left-[5%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("saigon time ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('clock')}
          zIndex={cardZIndices.clock}
        >
          <div className="bg-card border border-border/60 rounded-xl px-5 py-4 shadow-card w-fit whitespace-nowrap">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: 'var(--sans)' }}>Saigon, VN</p>
            <div className="flex items-end gap-1.5">
              <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums" style={{ fontFamily: 'var(--mono)' }}>
                {timeStr}
              </span>
              <span className="text-[9px] text-foreground/40 mb-1 uppercase tracking-widest" style={{ fontFamily: 'var(--sans)' }}>{period}</span>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1.5" style={{ fontFamily: 'var(--mono)' }}>ICT · UTC+7</p>
          </div>
        </DraggableCard>

        {/* 11. Rate Portfolio Stars Card */}
        <DraggableCard
          dragConstraints={containerRef}
          initialRotate={-4}
          className="bottom-[22%] left-[25%]"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("give rating! ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('rating')}
          zIndex={cardZIndices.rating}
        >
          <div className="bg-card border border-border/60 rounded-xl px-5 py-4 shadow-card w-full">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'var(--sans)' }}>rate this portfolio</p>
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
          dragConstraints={containerRef}
          initialRotate={-2}
          initialScale={0.5}
          className="bottom-[25%] left-[40%] flex flex-col items-center group origin-bottom"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseEnter={enterCard("open writings ✦")}
          onMouseLeave={leaveCard}
          onPointerDown={() => bringToFront('folder')}
          zIndex={cardZIndices.folder}
        >
          <a className="file relative w-60 h-40 cursor-pointer [perspective:1500px] z-50 block" href="/blog">
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
          <p className="mt-6 text-xl uppercase tracking-widest text-muted-foreground select-none" style={{ fontFamily: 'var(--sans)' }}>My writings</p>
        </DraggableCard>

        {/* -------------------- END DYNAMIC CARDS -------------------- */}

        {/* Custom Morphing Cursor Follower Tooltip */}
        <motion.div 
          className="absolute pointer-events-none z-[200] -translate-x-1/2 -translate-y-1/2"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            opacity: cursorOpacity,
            scale: isDraggingAny ? 0.65 : 0.95,
          }}
          transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.18 } }}
        >
          <div className="bg-[#0075de] text-white rounded-full px-[22px] py-[8px] text-[13px] font-medium tracking-tight whitespace-nowrap shadow-lg flex items-center gap-1.5" style={{ fontFamily: 'var(--sans)' }}>
            {cursorText}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
