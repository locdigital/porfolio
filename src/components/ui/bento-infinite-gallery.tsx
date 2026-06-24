"use client";

import { animate, motion, useAnimationFrame, useMotionValue, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type BentoItem = {
  id: number;
  title: string;
  desc: string;
  url: string;
  fullUrl?: string;
  span?: "hero" | "tall" | "wide" | "standard";
};

type BentoInfiniteGalleryProps = {
  id?: string;
  className?: string;
  kicker?: string;
  title?: string;
  description?: string;
  sectionNumber?: string;
  showIntro?: boolean;
  showSectionHeader?: boolean;
  items?: BentoItem[];
};

const introContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.06,
    },
  },
};

const introChildVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const railVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(14px)",
  },
  visible: (showIntro: boolean) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: showIntro ? 0.62 : 0.16,
      duration: 0.76,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const demoItems: BentoItem[] = [
  {
    id: 1,
    title: "Mountain Vista",
    desc: "Serenity above the clouds.",
    url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=82",
    span: "hero",
  },
  {
    id: 2,
    title: "Coastal Arch",
    desc: "Where the land meets the sea.",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=82",
    span: "standard",
  },
  {
    id: 3,
    title: "Forest Canopy",
    desc: "Sunlight filtering through leaves.",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82",
    span: "standard",
  },
  {
    id: 4,
    title: "Desert Dunes",
    desc: "Golden sands under the sun.",
    url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=900&q=82",
    span: "tall",
  },
  {
    id: 5,
    title: "City at Night",
    desc: "A vibrant urban landscape.",
    url: "https://images.unsplash.com/photo-1506606401543-2e73709cebb4?auto=format&fit=crop&w=1000&q=82",
    span: "standard",
  },
  {
    id: 6,
    title: "Misty Lake",
    desc: "Morning fog over calm waters.",
    url: "https://images.unsplash.com/photo-1634023233766-0c16b151bfb0?auto=format&fit=crop&w=1100&q=82",
    span: "wide",
  },
  {
    id: 7,
    title: "Canyon Light",
    desc: "A quiet blaze across stone.",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=82",
    span: "standard",
  },
  {
    id: 8,
    title: "Alpine Road",
    desc: "Thin air, long shadows.",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=82",
    span: "tall",
  },
];

function wrapLoop(value: number, width: number) {
  if (!width) return value;
  return ((value % -width) + -width) % -width;
}

export default function BentoInfiniteGallery({
  id,
  className = "",
  kicker = "Bento gallery",
  title = "Curated Moments",
  description = "A collection of cinematic landscapes. Drag to explore, hover for details, click to expand.",
  sectionNumber = "02",
  showIntro = true,
  showSectionHeader = false,
  items = demoItems,
}: BentoInfiniteGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [loopWidth, setLoopWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.18], [34, 0]);

  useEffect(() => {
    if (!groupRef.current) return;

    const measure = () => {
      if (!groupRef.current) return;
      setLoopWidth(groupRef.current.scrollWidth);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(groupRef.current);
    window.addEventListener("load", measure, { once: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("load", measure);
    };
  }, []);

  useEffect(() => {
    if (!loopWidth) return;
    const unsubscribe = x.on("change", latest => {
      if (latest <= -loopWidth || latest > 0) {
        x.set(wrapLoop(latest, loopWidth));
      }
    });
    return unsubscribe;
  }, [loopWidth, x]);

  useAnimationFrame((_, delta) => {
    if (paused || isPointerDown || !loopWidth || prefersReducedMotion) return;
    x.set(wrapLoop(x.get() - delta * 0.035, loopWidth));
  });

  function moveGallery(direction: "previous" | "next") {
    if (!loopWidth) return;
    const distance = Math.min(620, Math.max(280, window.innerWidth * 0.42));
    const target = wrapLoop(x.get() + (direction === "previous" ? distance : -distance), loopWidth);
    animate(x, target, {
      type: "spring",
      stiffness: 180,
      damping: 28,
      mass: 0.8,
    });
  }

  const repeatedGroups = [0, 1, 2];

  return (
    <section id={id} className={`big-section ${className}`.trim()} ref={sectionRef} aria-label="Infinite bento gallery">
      {showSectionHeader && (
        <div className="container big-section-heading">
          <div className="sh">
            <span className="sh-title" data-parallax=".1">{kicker}</span>
            <span className="sh-number" data-parallax=".3">{sectionNumber}</span>
          </div>
        </div>
      )}

      {showIntro && (
        <motion.div
          className="big-copy"
          initial={prefersReducedMotion ? false : "hidden"}
          animate="visible"
          variants={introContainerVariants}
          style={{ opacity: headerOpacity, y: headerY }}
        >
          <motion.p className="big-kicker" variants={introChildVariants}>{kicker}</motion.p>
          <motion.h1 variants={introChildVariants}>{title}</motion.h1>
          <motion.p variants={introChildVariants}>{description}</motion.p>
        </motion.div>
      )}

      <motion.div
        className="big-rail-shell"
        custom={showIntro}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={railVariants}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          className="big-nav big-nav-previous"
          type="button"
          aria-label="Previous photos"
          onClick={() => moveGallery("previous")}
        >
          <ChevronLeft size={21} strokeWidth={2} />
        </button>
        <button
          className="big-nav big-nav-next"
          type="button"
          aria-label="Next photos"
          onClick={() => moveGallery("next")}
        >
          <ChevronRight size={21} strokeWidth={2} />
        </button>
        <motion.div
          className="big-track"
          style={{ x }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: -100000, right: 100000 }}
          onDragStart={() => setIsPointerDown(true)}
          onDragEnd={() => {
            setIsPointerDown(false);
            if (loopWidth) x.set(wrapLoop(x.get(), loopWidth));
          }}
        >
          {repeatedGroups.map(groupIndex => (
            <div
              className="big-group"
              ref={groupIndex === 0 ? groupRef : undefined}
              aria-hidden={groupIndex !== 0}
              key={groupIndex}
            >
              {items.map((item, itemIndex) => (
                <div
                  className={`animated-card big-card big-card-${item.span || "standard"} ${item.span === "hero" ? "featured-card" : "normal-card"}`}
                  data-card-type={item.span === "hero" ? "featured" : "normal"}
                  role="img"
                  aria-label={`${item.title}. ${item.desc}`}
                  key={`${groupIndex}-${item.id}`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading={groupIndex === 0 && itemIndex < 4 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={groupIndex === 0 && itemIndex < 2 ? "high" : "auto"}
                    draggable={false}
                  />
                  <span className="big-scrim" aria-hidden="true" />
                  <span className="big-card-copy">
                    <strong>{item.title}</strong>
                    <small>{item.desc}</small>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <style>{`
        .big-section {
          width: 100%;
          overflow: hidden;
          background: transparent;
          padding: clamp(58px, 7vw, 90px) 0 clamp(54px, 8vh, 88px);
          color: #111214;
        }

        .big-section-heading {
          margin-bottom: clamp(24px, 4vw, 42px);
        }

        .big-copy {
          width: min(100% - 32px, 760px);
          margin: 0 auto;
          text-align: center;
        }

        .big-kicker {
          margin: 0 0 12px;
          font-family: var(--mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(17, 18, 20, 0.52);
        }

        .big-copy h1 {
          margin: 0;
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(46px, 8vw, 96px);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: 0;
        }

        .big-copy > p:last-child {
          margin: 18px auto 0;
          max-width: 590px;
          font-size: clamp(15px, 1.8vw, 18px);
          line-height: 1.65;
          color: rgba(17, 18, 20, 0.62);
        }

        .big-rail-shell {
          position: relative;
          width: 100%;
          min-height: calc(27rem + 5px);
          margin-top: ${showIntro ? "clamp(34px, 6vw, 64px)" : "0"};
          cursor: grab;
          -webkit-user-select: none;
          user-select: none;
        }

        .big-rail-shell:active {
          cursor: grabbing;
        }

        .big-rail-shell::before,
        .big-rail-shell::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 3;
          width: clamp(28px, 8vw, 130px);
          pointer-events: none;
        }

        .big-rail-shell::before {
          left: 0;
          background: linear-gradient(90deg, var(--bg, #fafaf7) 0%, rgba(250, 250, 247, 0) 100%);
        }

        .big-rail-shell::after {
          right: 0;
          background: linear-gradient(270deg, var(--bg, #fafaf7) 0%, rgba(250, 250, 247, 0) 100%);
        }

        .big-nav {
          position: absolute;
          top: 50%;
          z-index: 5;
          display: grid;
          width: 46px;
          height: 46px;
          place-items: center;
          border: 1px solid rgba(17, 18, 20, 0.1);
          border-radius: 999px;
          color: rgba(17, 18, 20, 0.78);
          background: rgba(250, 250, 247, 0.76);
          box-shadow: 0 18px 48px rgba(17, 18, 20, 0.14);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transform: translateY(-50%);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .big-nav:hover {
          color: #111214;
          background: rgba(250, 250, 247, 0.94);
          transform: translateY(-50%) scale(1.05);
        }

        .big-nav-previous {
          left: clamp(14px, 4vw, 64px);
        }

        .big-nav-next {
          right: clamp(14px, 4vw, 64px);
        }

        .big-track {
          display: flex;
          width: max-content;
          gap: 5px;
          padding: 0 16px;
          will-change: transform;
        }

        .big-group {
          display: grid;
          grid-auto-flow: column dense;
          grid-auto-columns: minmax(15rem, 1fr);
          grid-template-rows: repeat(2, minmax(13.5rem, 1fr));
          gap: 5px;
        }

        .big-card {
          position: relative;
          display: flex;
          min-width: 15rem;
          min-height: 13.5rem;
          align-items: flex-end;
          overflow: hidden;
          border: 1px solid rgba(17, 18, 20, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          padding: 18px;
          text-align: left;
          box-shadow: 0 18px 44px rgba(17, 18, 20, 0.08);
          cursor: default;
          isolation: isolate;
        }

        .big-card-hero {
          grid-column: span 2;
          grid-row: span 2;
          min-width: 32rem;
        }

        .big-card-tall {
          grid-row: span 2;
        }

        .big-card-wide {
          grid-column: span 2;
          min-width: 32rem;
        }

        .big-card img {
          position: absolute;
          inset: 0;
          z-index: -2;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.001);
          pointer-events: none;
        }

        .big-scrim {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.06) 34%, rgba(0, 0, 0, 0) 68%);
          opacity: 0;
          transition: opacity 0.36s ease;
        }

        .big-card:hover .big-scrim,
        .big-card:focus-visible .big-scrim {
          opacity: 1;
        }

        .big-card-copy {
          display: grid;
          gap: 4px;
          color: #fff;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .big-card:hover .big-card-copy,
        .big-card:focus-visible .big-card-copy {
          opacity: 1;
          transform: translateY(0);
        }

        .big-card-copy strong {
          font-size: 18px;
          line-height: 1.15;
        }

        .big-card-copy small {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 760px) {
          .big-section {
            padding-top: 68px;
          }

          .big-copy {
            width: min(100% - 28px, 480px);
            text-align: left;
          }

          .big-copy h1 {
            font-size: clamp(44px, 15vw, 68px);
          }

          .big-copy > p:last-child {
            margin-left: 0;
            font-size: 15px;
          }

          .big-rail-shell {
            margin-top: 30px;
            min-height: 62vh;
          }

          .big-track {
            gap: 5px;
            padding: 0 14px;
          }

          .big-group {
            grid-auto-columns: minmax(76vw, 1fr);
            grid-template-rows: minmax(62vh, 1fr);
            gap: 5px;
          }

          .big-card,
          .big-card-hero,
          .big-card-wide,
          .big-card-tall {
            grid-column: span 1;
            grid-row: span 1;
            min-width: 76vw;
            min-height: 62vh;
            border-radius: 10px;
            padding: 16px;
          }

          .big-scrim {
            opacity: 0.65;
          }

          .big-card-copy {
            opacity: 1;
            transform: none;
          }

          .big-nav {
            width: 42px;
            height: 42px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .big-track,
          .big-card,
          .big-card img,
          .big-card-copy,
          .big-scrim {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
