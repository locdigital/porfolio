import React, { useState, useEffect } from 'react';
import { FolderOpen, Globe2, Laptop, MapPin } from 'lucide-react';

interface MobileAboutPanelProps {
  portraitSrc?: string;
}

export default function MobileAboutPanel({ portraitSrc = "/himmel-vua.jpeg" }: MobileAboutPanelProps) {
  // Spotify audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(125);
  const totalSeconds = 259;

  // Star rating states
  const [rating, setRating] = useState(0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setProgressSeconds((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying]);

  return (
    <div className="mobile-about-panel md:hidden h-auto flex flex-col gap-3 px-4 pt-14 pb-8 pointer-events-auto relative z-10" style={{ fontFamily: 'var(--sans)' }}>
      {/* Soundwave keyframes */}
      <style>{`
        @keyframes soundwave-bounce {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1.15); }
        }
      `}</style>

      <h2 className="italic leading-[1.05] mb-2 font-light" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--fs-display)' }}>
        I turn paid traffic into profit.
      </h2>

      {/* Sub-grid 1: Profile and Available status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-2.5 pb-6 shadow-[0_6px_28px_-6px_rgba(0,0,0,0.18)] -rotate-[2deg]">
          <div className="overflow-hidden rounded-lg w-full">
            <img src={portraitSrc} alt="Phuc Loc" className="aspect-square w-full object-cover object-center pointer-events-none" loading="lazy" decoding="async" draggable={false} />
          </div>
          <p className="mt-2.5 text-micro text-muted-foreground tracking-widest text-center">Phuc Loc · Saigon</p>
        </div>

        <div className="bg-[#BDF8D1] border border-[#4fb77a]/25 text-[#073b24] rounded-xl px-4 py-4 rotate-[1.5deg] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#073b24] opacity-40" style={{ animationDuration: '2s' }}></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#073b24]"></span>
              </span>
              <span className="text-micro uppercase tracking-widest opacity-60" style={{ fontFamily: 'var(--mono)' }}>available now</span>
            </div>
            <div className="h-px bg-[#073b24]/20 mb-2.5"></div>
            <p className="italic text-lg leading-tight mb-2.5" style={{ fontFamily: 'var(--serif)' }}>Performance Marketer</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5"><MapPin className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-micro">Ho Chi Minh City</span></div>
            <div className="flex items-center gap-1.5"><Laptop className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-micro">Remote Vietnam</span></div>
            <div className="flex items-center gap-1.5"><Globe2 className="opacity-60" size={11} strokeWidth={1.8} aria-hidden="true" /><span className="text-micro">Global remote</span></div>
          </div>
        </div>
      </div>

      {/* Sub-grid 2: Music widget and Star rate */}
      <div className="grid grid-cols-2 gap-3">
        {/* Spotify */}
        <div className="bg-foreground text-background rounded-2xl p-3 shadow-xl rotate-[0.5deg] flex flex-col gap-2" id="mobile-spotify">
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden">
              <img src="/images/X_cover.webp" alt="Photograph" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-cover pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-micro font-semibold text-background truncate">Photograph</p>
              <p className="text-micro text-background/50 truncate">Ed Sheeran</p>
            </div>
          </div>
          
          {/* Audio wave */}
          <span className="inline-flex items-end gap-[2px] h-3">
            {[0.25, 0.69, 0.62, 0.41, 0.59].map((height, i) => {
              const barsBounceStyles = [
                'animate-[soundwave-bounce_1.8s_ease-in-out_infinite_alternate]',
                'animate-[soundwave-bounce_2.2s_ease-in-out_infinite_alternate_0.3s]',
                'animate-[soundwave-bounce_2.6s_ease-in-out_infinite_alternate_0.6s]',
                'animate-[soundwave-bounce_1.6s_ease-in-out_infinite_alternate_0.1s]',
                'animate-[soundwave-bounce_2.0s_ease-in-out_infinite_alternate_0.45s]',
              ];
              const barClass = `w-[2px] rounded-full bg-white/70 origin-bottom ${isPlaying ? barsBounceStyles[i] : ''}`;
              return (
                <span 
                  key={i}
                  className={barClass} 
                  style={{ height: '12px', transform: isPlaying ? undefined : `scaleY(${height})` }} 
                />
              );
            })}
          </span>

          {/* Slider */}
          <div className="relative h-[3px] bg-white/20 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-white/80 rounded-full" id="spotify-progress" style={{ width: `${(progressSeconds / totalSeconds) * 100}%` }}></div>
          </div>
          <div className="flex justify-between" style={{ fontFamily: 'var(--mono)' }}>
            <span className="text-micro text-background/30" id="spotify-time">{formatTime(progressSeconds)}</span>
            <span className="text-micro text-background/30">4:19</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button aria-label="Previous track" className="text-background/40 text-xs">⏮</button>
            <button 
              id="spotify-play-btn"
              aria-label={isPlaying ? "Pause" : "Play"} 
              className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground text-xs"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '||' : '▶'}
            </button>
            <button aria-label="Next track" className="text-background/40 text-xs">⏭</button>
          </div>
        </div>

        {/* Rating */}
        <div className="-rotate-[1deg]">
          <div className="relative">
            <div className="bg-card border border-border/60 rounded-xl px-4 py-4 shadow-card w-full">
              <p className="text-micro uppercase tracking-widest text-muted-foreground mb-3">rate this portfolio</p>
              <div className="flex gap-0.5" id="mobile-rating">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const active = starIdx <= rating;
                  return (
                    <button 
                      key={starIdx}
                      className="star-btn leading-none transition-transform duration-100 hover:scale-125 cursor-pointer" 
                      aria-label={`Rate ${starIdx} stars`}
                      onClick={() => setRating(starIdx)}
                    >
                      <span style={{ display: 'inline-block', transform: 'none' }}>
                        <span 
                          className="relative inline-block w-6 h-6 transition-colors duration-200" 
                          style={{ color: active ? '#FABE15' : '#d1d5db' }}
                        >
                          <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full fill-current">
                            {active ? (
                              <path d="M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5Z"></path>
                            ) : (
                              <path d="M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5ZM12 4.75L14 9.33L18.7 9.75L15 13.07L16.18 17.75L12 15.16L7.82 17.75L9 13.07L5.3 9.75L10 9.33L12 4.75Z"></path>
                            )}
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FF6B47] text-white rounded-xl px-4 py-4 -rotate-[1deg]">
          <p className="text-micro leading-snug">CrossFit before work,<br />restaurants on weekends,<br />music always on.</p>
        </div>
        <div className="bg-accent text-accent-foreground rounded-xl px-4 py-4 rotate-[2deg]">
          <p className="text-micro uppercase tracking-widest text-accent-foreground/60 mb-1.5">currently building</p>
          <p className="text-micro leading-snug font-medium">This demo site.<br /><span className="text-accent-foreground/70 font-normal">(meta, right?)</span></p>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3.5 shadow-card -rotate-[0.5deg]">
        <p className="text-micro uppercase tracking-widest text-muted-foreground mb-2.5">interests</p>
        <div className="flex flex-wrap gap-1.5">
          {["CrossFit", "Music", "Reading", "Nature walks", "New restaurants", "Japanese learner", "AI-first"].map((interest) => (
            <span key={interest} className="px-2.5 py-1 rounded-full border border-border text-micro text-foreground/70">{interest}</span>
          ))}
        </div>
      </div>

      {/* Writings Folder */}
      <div className="flex flex-col items-center mt-4">
        <a href="/blog" className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl shadow-lg text-xs">
          <FolderOpen size={15} strokeWidth={1.8} aria-hidden="true" /> View My Writings
        </a>
      </div>
    </div>
  );
}
