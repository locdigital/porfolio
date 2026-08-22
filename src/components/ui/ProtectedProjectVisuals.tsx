import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, KeyRound, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface ProtectedProjectVisualsProps {
  images: string[];
  title: string;
  password?: string;
  projectSlug: string;
  description?: string;
}

const gateDescriptions: Record<string, string> = {
  playah: "Unlock internal campaign dashboards, TikTokShop KOC booking pipelines, Meta-to-Web ad metrics, and AI sales conversation flows for PlayAh! Vietnam.",
  "tomato-childrens-home": "Unlock full-funnel Marketing 360 campaign visuals, student enrollment CPL reduction analytics, landing page variations, and 40,000+ contact email automation workflows.",
  "workflow-space": "Unlock high-converting landing page UI components, Astro build performance specs, automated lead intake funnels, and design system assets.",
  "pops-worldwide": "Unlock digital media distribution analytics, audience engagement campaign assets, multi-platform publishing metrics, and content growth workflows.",
  "education-communities": "Unlock community growth dashboards, 4M+ member reach metrics, content distribution breakdowns, and student career guidance assets.",
};

export default function ProtectedProjectVisuals({
  images,
  title,
  password,
  projectSlug,
  description,
}: ProtectedProjectVisualsProps) {
  const activeDescription =
    description ||
    gateDescriptions[projectSlug] ||
    `Enter the passcode to unlock confidential campaign dashboards, analytics, and visual assets for ${title}.`;
  const storageKey = `protected_visuals_${projectSlug}`;
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!password);
  const [inputPassword, setInputPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (!password) {
      setIsUnlocked(true);
      return;
    }

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored === "unlocked") {
        setIsUnlocked(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [storageKey, password]);

  const resetError = () => {
    if (!isError) return;
    setIsError(false);
    setInputPassword("");
    setShowPassword(false);
  };

  const showErrorState = () => {
    setIsError(true);
    setInputPassword("Incorrect access code. Please try again.");
    setShowPassword(true);
    triggerShake();
  };

  const handleUnlock = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (isError) {
      triggerShake();
      return;
    }

    if (!inputPassword.trim()) {
      showErrorState();
      return;
    }

    if (password && inputPassword.trim() === password.trim()) {
      setIsUnlocked(true);
      setIsError(false);
      try {
        sessionStorage.setItem(storageKey, "unlocked");
      } catch (e) {
        // Ignore storage errors
      }
    } else {
      showErrorState();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  if (!images || images.length === 0) return null;

  return (
    <section id="showcase" className="py-16 sm:py-20 border-b border-border/40 last:border-0 scroll-mt-20">
      {/* Inline Animation Styles */}
      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-lock-shake {
          animation: lockShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {/* SECTION HEADER */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-mono-label text-accent uppercase tracking-wider text-xs font-medium flex items-center gap-1.5">
            <Sparkles size={12} className="shrink-0" />
            <span>Showcase</span>
          </p>
          {(projectSlug.includes("workflow") || projectSlug.includes("tomato")) && (
            <h2 className="mt-2 font-display text-display-xs leading-[1.2] tracking-[-0.02em] text-foreground">
              Project Visuals
            </h2>
          )}
        </div>

        {isUnlocked && password && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-medium animate-fadeIn">
            <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
            <span>Access Granted</span>
          </div>
        )}
      </div>

      {/* LOCKED PASSWORD CARD */}
      {!isUnlocked ? (
        <div className="w-full max-w-xl mx-auto my-6">
          <div
            className={`relative overflow-hidden rounded-3xl border border-border/80 bg-card/75 backdrop-blur-xl p-8 sm:p-11 shadow-2xl transition-all duration-300 ${
              shake ? "animate-lock-shake border-red-500/50 ring-2 ring-red-500/20" : "hover:border-border"
            }`}
          >
            {/* Multi-layered Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Security Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border text-[11px] font-mono tracking-wider uppercase text-muted-foreground mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Restricted Access</span>
              </div>

              {/* Lock Badge Icon Box */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-secondary to-secondary/60 border border-border/90 flex items-center justify-center text-accent shadow-inner mb-5 group hover:scale-105 transition-transform duration-300">
                <Lock size={28} strokeWidth={1.8} className="drop-shadow-sm" />
              </div>

              <h3 className="font-display font-normal text-3xl sm:text-4xl text-foreground tracking-tight">
                Protected Content
              </h3>

              <p className="font-sans text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
                {activeDescription}
              </p>

              {/* Password Form */}
              <form onSubmit={handleUnlock} className="w-full mt-7 space-y-4">
                <div className="relative w-full">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 pointer-events-none">
                    <KeyRound size={18} />
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={inputPassword}
                    onFocus={resetError}
                    onClick={resetError}
                    onChange={(e) => {
                      if (isError) {
                        resetError();
                      } else {
                        setInputPassword(e.target.value);
                      }
                    }}
                    placeholder="Enter access code..."
                    className={`w-full pl-11 pr-12 py-3.5 rounded-xl font-sans text-sm outline-none transition-all shadow-inner ${
                      isError
                        ? "border-2 border-red-500 bg-red-500/10 text-red-500 font-medium placeholder:text-red-400/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "bg-secondary/40 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 text-foreground placeholder:text-muted-foreground/60"
                    }`}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (isError) resetError();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/80"
                    title={showPassword ? "Hide passcode" : "Show passcode"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-accent text-white font-sans font-medium text-sm hover:bg-accent/90 active:scale-[0.99] transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Unlock Visuals</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/70 mt-6">
                <Lock size={12} className="shrink-0" />
                <span>Passcode required for client-confidential materials</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* UNLOCKED GALLERY SHOWCASE */
        <div className="mt-8 space-y-6">
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="w-full rounded-2xl overflow-hidden bg-secondary border border-border p-4 shadow-sm group hover:border-border/80 transition-all duration-300"
            >
              <img
                src={imgUrl}
                alt={`${title} visual ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto object-contain rounded-xl group-hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
