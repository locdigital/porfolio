import { Check, ChevronLeft, ChevronRight, GripHorizontal, Sparkles, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

import { cn } from "../../lib/utils";

interface PerformanceMetric {
  label: string;
  value: string;
}

interface PerformancePanel {
  eyebrow?: string;
  title: string;
  description?: string;
  metrics?: PerformanceMetric[];
}

interface PerformanceHighlight {
  id: string;
  title: string;
  description?: string;
  icon?: "check" | "sparkles" | "zap";
}

interface ComparisonImage {
  src: string;
  alt: string;
}

export interface BeforeAfterPerformanceProps {
  badge?: string;
  heading?: string;
  description?: string;
  highlights?: PerformanceHighlight[];
  beforeImage?: ComparisonImage;
  afterImage?: ComparisonImage;
  beforePanel?: PerformancePanel;
  afterPanel?: PerformancePanel;
  beforeLabel?: string;
  afterLabel?: string;
  showLabels?: boolean;
  orientation?: "horizontal" | "vertical";
  initialPosition?: number;
  dividerWidth?: number;
  className?: string;
}

const iconMap = {
  check: Check,
  sparkles: Sparkles,
  zap: Zap,
};

const DIVIDER_COLOR = "#0075de";
const MIN_DIVIDER_WIDTH = 1.5;

const RANDOM_IMAGE_PAIRS: { category: string; before: ComparisonImage; after: ComparisonImage }[] = [
  {
    category: "Analytics & Growth Dashboard",
    before: {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình A - Baseline Analytics & Spend Dashboard",
    },
    after: {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình B - Scaled Conversion Engine & ROAS Dashboard",
    },
  },
  {
    category: "Product & UI Transformation",
    before: {
      src: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình A - Legacy Wireframe & Code Structure",
    },
    after: {
      src: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình B - Modern Polished Design System",
    },
  },
  {
    category: "Brand & Creative Identity",
    before: {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình A - Scattered Concept Assets",
    },
    after: {
      src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình B - 3D Polished Visual Architecture",
    },
  },
  {
    category: "Digital Campaign Funnel",
    before: {
      src: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình A - Initial Campaign Setup Workspace",
    },
    after: {
      src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình B - High Performance Conversion Growth Machine",
    },
  },
  {
    category: "E-Commerce Experience",
    before: {
      src: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình A - Basic Storefront Setup",
    },
    after: {
      src: "https://images.unsplash.com/photo-1556742049-0a67daf64f42?auto=format&fit=crop&w=1400&q=80",
      alt: "Hình B - High CVR Checkout Experience",
    },
  },
];

function PerformanceState({ panel, fallbackLabel }: { panel?: PerformancePanel; fallbackLabel: string }) {
  return (
    <div className="bap-state">
      <div>
        <p className="bap-state-eyebrow">{panel?.eyebrow ?? fallbackLabel}</p>
        <h3 className="bap-state-title">{panel?.title ?? `${fallbackLabel} state`}</h3>
        {panel?.description && <p className="bap-state-desc">{panel.description}</p>}
      </div>

      {panel?.metrics && panel.metrics.length > 0 && (
        <div className="bap-metrics">
          {panel.metrics.map((metric) => (
            <div className="bap-metric" key={`${metric.label}-${metric.value}`}>
              <span>{metric.value}</span>
              <p>{metric.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BeforeAfterPerformance({
  badge = "Performance compare",
  heading = "Before / after performance lift",
  description = "Drag the slider to compare Hình A (Before) and Hình B (After).",
  highlights = [],
  beforeImage,
  afterImage,
  beforePanel,
  afterPanel,
  beforeLabel = "Hình A",
  afterLabel = "Hình B",
  orientation = "horizontal",
  initialPosition = 50,
  dividerWidth = 1.5,
  className,
}: BeforeAfterPerformanceProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [pairIndex, setPairIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef<number | null>(null);
  const latestPosRef = useRef<number>(initialPosition);
  const isHorizontal = orientation === "horizontal";

  useEffect(() => {
    // Randomize image pair on initial client render
    const randomIdx = Math.floor(Math.random() * RANDOM_IMAGE_PAIRS.length);
    setPairIndex(randomIdx);
  }, []);

  const activePair = RANDOM_IMAGE_PAIRS[pairIndex % RANDOM_IMAGE_PAIRS.length];
  const effectiveBeforeImage = beforeImage ?? activePair.before;
  const effectiveAfterImage = afterImage ?? activePair.after;
  const visibleDividerWidth = Math.max(dividerWidth, MIN_DIVIDER_WIDTH);


  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const nextPosition = isHorizontal
        ? ((clientX - rect.left) / rect.width) * 100
        : ((clientY - rect.top) / rect.height) * 100;

      const clamped = Math.max(0, Math.min(100, nextPosition));
      latestPosRef.current = clamped;

      if (reqRef.current === null) {
        reqRef.current = requestAnimationFrame(() => {
          setPosition(latestPosRef.current);
          reqRef.current = null;
        });
      }
    },
    [isHorizontal]
  );

  const handlePointerStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      updatePosition(clientX, clientY);
    },
    [updatePosition]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;

    if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setPosition((current) => Math.max(0, current - step));
    }

    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setPosition((current) => Math.min(100, current + step));
    }
  };

  useEffect(() => {
    return () => {
      if (reqRef.current !== null) {
        cancelAnimationFrame(reqRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      updatePosition(event.clientX, event.clientY);
    };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <section className={cn("before-after-performance", className)}>
      <style>{`
        .before-after-performance,
        .before-after-performance * {
          box-sizing: border-box;
        }

        .before-after-performance :is(div, p, span) {
          font-size: revert !important;
        }

        .bap-shell {
          display: grid;
          grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
          gap: clamp(28px, 5vw, 72px);
          align-items: center;
          padding: clamp(56px, 8vw, 104px) 0;
          border-bottom: 1px solid var(--divider);
        }

        .bap-copy {
          align-self: center;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .bap-badge {
          align-self: flex-start;
          border: 1px solid var(--divider);
          border-radius: 999px;
          color: var(--muted);
          font-family: var(--mono);
          font-size: 12px !important;
          letter-spacing: 0.08em;
          line-height: 1;
          padding: 8px 11px;
          text-transform: uppercase;
        }

        .bap-heading {
          color: var(--text);
          font-family: var(--serif);
          font-size: clamp(36px, 5vw, 62px) !important;
          font-weight: 400;
          letter-spacing: -0.035em;
          line-height: 0.98;
          margin: 0;
        }

        .bap-description {
          color: var(--muted);
          font-family: var(--sans);
          font-size: 14px !important;
          line-height: 1.65;
          margin: 0;
          max-width: 48ch;
        }

        .bap-highlights {
          display: grid;
          gap: 10px;
          margin-top: 8px;
        }

        .bap-highlight {
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.48);
          border: 1px solid rgba(232, 232, 226, 0.72);
          border-radius: 12px;
          display: grid;
          gap: 12px;
          grid-template-columns: 28px 1fr;
          padding: 13px 14px;
        }

        .bap-highlight-icon {
          align-items: center;
          background: color-mix(in srgb, var(--accent) 12%, #ffffff);
          border-radius: 999px;
          color: var(--accent);
          display: inline-flex;
          height: 28px;
          justify-content: center;
          width: 28px;
        }

        .bap-highlight-title {
          color: var(--text);
          font-family: var(--sans);
          font-size: 14px !important;
          font-weight: 600;
          line-height: 1.25;
          margin: 0;
        }

        .bap-highlight-desc {
          color: var(--muted);
          font-family: var(--sans);
          font-size: 12px !important;
          line-height: 1.45;
          margin: 4px 0 0;
        }

        .bap-slider-wrap {
          align-self: center;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(232, 232, 226, 0.72);
          border-radius: 16px;
          box-shadow: 0 18px 52px rgba(28, 28, 28, 0.08);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bap-slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 4px;
        }

        .bap-slider-tag {
          font-family: var(--mono);
          font-size: 11px !important;
          color: var(--muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .bap-random-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--divider);
          border-radius: 999px;
          padding: 5px 12px;
          font-family: var(--sans);
          font-size: 12px !important;
          font-weight: 500;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
        }

        .bap-random-btn:hover {
          background: #ffffff;
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }

        .bap-random-btn:active {
          transform: translateY(0) scale(0.97);
        }

        .bap-slider {
          aspect-ratio: 16 / 10;
          border-radius: 16px;
          cursor: ew-resize;
          overflow: hidden;
          position: relative;
          touch-action: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .bap-slider::before {
          content: "";
          position: absolute;
          background: ${DIVIDER_COLOR};
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.85), 0 0 18px rgba(0, 117, 222, 0.28);
          pointer-events: none;
          z-index: 70;
        }

        .bap-slider:not(.is-vertical)::before {
          bottom: 0;
          left: var(--bap-divider-position);
          top: 0;
          transform: translateX(-50%);
          width: var(--bap-divider-size);
        }

        .bap-slider.is-vertical::before {
          height: var(--bap-divider-size);
          left: 0;
          right: 0;
          top: var(--bap-divider-position);
          transform: translateY(-50%);
        }

        .bap-slider * {
          pointer-events: none;
          user-select: none;
        }

        .bap-slider.is-vertical {
          cursor: ns-resize;
        }

        .bap-layer {
          inset: 0;
          position: absolute;
          transition: opacity 0.3s ease;
        }

        .bap-layer img {
          height: 100%;
          object-fit: cover;
          width: 100%;
        }

        .bap-after-layer {
          background: linear-gradient(135deg, #f7fbff 0%, #ffffff 48%, #fff4ec 100%);
          z-index: 1;
        }

        .bap-before-layer {
          background: linear-gradient(135deg, #f0f3f5 0%, #f8f6ef 100%);
          will-change: clip-path;
          z-index: 2;
          position: absolute;
          inset: 0;
        }

        .bap-slider:not(.is-dragging) .bap-before-layer {
          transition: clip-path 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bap-state {
          display: flex;
          flex-direction: column;
          gap: 22px;
          height: 100%;
          justify-content: space-between;
          padding: clamp(22px, 4vw, 42px);
          width: 100%;
        }

        .bap-state-eyebrow {
          color: var(--muted);
          font-family: var(--mono);
          font-size: 12px !important;
          letter-spacing: 0.08em;
          margin: 0 0 14px;
          text-transform: uppercase;
        }

        .bap-state-title {
          color: var(--text);
          font-family: var(--serif);
          font-size: clamp(36px, 5vw, 58px) !important;
          font-weight: 400;
          letter-spacing: -0.035em;
          line-height: 0.95;
          margin: 0;
        }

        .bap-state-desc {
          color: var(--muted);
          font-family: var(--sans);
          font-size: 14px !important;
          line-height: 1.55;
          margin: 16px 0 0;
          max-width: 42ch;
        }

        .bap-metrics {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .bap-metric {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(232, 232, 226, 0.8);
          border-radius: 12px;
          padding: 12px;
        }

        .bap-metric span {
          color: var(--text);
          display: block;
          font-family: var(--serif);
          font-size: 30px !important;
          line-height: 0.95;
        }

        .bap-metric p {
          color: var(--muted);
          font-family: var(--mono);
          font-size: 10px !important;
          letter-spacing: 0.04em;
          line-height: 1.25;
          margin: 8px 0 0;
          text-transform: uppercase;
        }

        .bap-divider {
          background: ${DIVIDER_COLOR} !important;
          border-radius: 0;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
          overflow: visible;
          position: absolute;
          z-index: 75 !important;
          pointer-events: none;
          will-change: left, top;
        }

        .bap-slider:not(.is-dragging) .bap-divider {
          transition: left 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bap-divider.is-horizontal {
          bottom: 0;
          height: 100%;
          top: 0;
          transform: translateX(-50%) !important;
        }

        .bap-divider.is-vertical {
          width: 100%;
          left: 0;
          right: 0;
          transform: translateY(-50%) !important;
        }

        .bap-handle {
          align-items: center;
          background: #ffffff !important;
          border: 2px solid ${DIVIDER_COLOR};
          border-radius: 999px;
          color: ${DIVIDER_COLOR} !important;
          display: inline-flex;
          height: 32px;
          justify-content: center;
          left: 50%;
          position: absolute;
          top: 50%;
          z-index: 100 !important;
          transform: translate(-50%, -50%) scale(1) !important;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          width: 32px;
          box-shadow: 0 6px 20px rgba(28, 28, 28, 0.16), 0 0 0 3px rgba(255, 255, 255, 0.94);
          pointer-events: auto;
        }

        .bap-slider:hover .bap-handle {
          transform: translate(-50%, -50%) scale(1.08) !important;
          box-shadow: 0 8px 24px rgba(28, 28, 28, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.96);
        }

        .bap-slider.is-dragging .bap-handle {
          transform: translate(-50%, -50%) scale(1.15) !important;
          box-shadow: 0 10px 28px rgba(28, 28, 28, 0.24), 0 0 0 4px rgba(255, 255, 255, 0.96);
        }

        .bap-label {
          background: rgba(28, 28, 28, 0.76);
          border-radius: 999px;
          color: #ffffff;
          font-family: var(--sans);
          font-size: 12px !important;
          font-weight: 600;
          line-height: 1;
          padding: 8px 12px;
          position: absolute;
          top: 14px;
          z-index: 20;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .bap-label.before {
          left: 14px;
        }

        .bap-label.after {
          right: 14px;
        }

        @media (max-width: 900px) {
          .bap-shell {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .bap-shell {
            padding: 48px 0;
          }

          .bap-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="bap-shell">
        <div className="bap-copy">
          {badge && <span className="bap-badge">{badge}</span>}
          {heading && <h2 className="bap-heading">{heading}</h2>}
          {description && <p className="bap-description">{description}</p>}

          {highlights.length > 0 && (
            <div className="bap-highlights">
              {highlights.map((highlight) => {
                const Icon = iconMap[highlight.icon ?? "check"];

                return (
                  <div className="bap-highlight" key={highlight.id}>
                    <span className="bap-highlight-icon" aria-hidden="true">
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="bap-highlight-title">{highlight.title}</p>
                      {highlight.description && <p className="bap-highlight-desc">{highlight.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bap-slider-wrap">
          <div className="bap-slider-header">
            <span className="bap-slider-tag">{activePair.category}</span>
          </div>

          <div
            ref={containerRef}
            role="slider"
            aria-label="Before and after performance comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            tabIndex={0}
            className={cn("bap-slider", !isHorizontal && "is-vertical", isDragging && "is-dragging")}
            style={{
              "--bap-divider-position": `${position}%`,
              "--bap-divider-size": `${visibleDividerWidth}px`,
            } as CSSProperties}
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePointerStart(event.clientX, event.clientY);
            }}
          >
            <div className="bap-layer bap-after-layer">
              {effectiveAfterImage?.src ? (
                <img src={effectiveAfterImage.src} alt={effectiveAfterImage.alt} loading="lazy" decoding="async" />
              ) : (
                <PerformanceState panel={afterPanel} fallbackLabel={afterLabel} />
              )}
            </div>

            <div
              className="bap-layer bap-before-layer"
              style={{
                clipPath: isHorizontal
                  ? `inset(0 ${100 - position}% 0 0)`
                  : `inset(0 0 ${100 - position}% 0)`,
              }}
            >
              {effectiveBeforeImage?.src ? (
                <img src={effectiveBeforeImage.src} alt={effectiveBeforeImage.alt} loading="lazy" decoding="async" />
              ) : (
                <PerformanceState panel={beforePanel} fallbackLabel={beforeLabel} />
              )}
            </div>

            <div
              className={cn("bap-divider", isHorizontal ? "is-horizontal" : "is-vertical")}
              style={{
                [isHorizontal ? "left" : "top"]: `${position}%`,
                [isHorizontal ? "width" : "height"]: `${visibleDividerWidth}px`,
              }}
            />

            <span
              className="bap-handle"
              aria-hidden="true"
              style={{
                left: isHorizontal ? `${position}%` : "50%",
                top: isHorizontal ? "50%" : `${position}%`,
              }}
            >
              {isHorizontal ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0px", color: "currentColor" }}>
                  <ChevronLeft size={14} strokeWidth={2.4} />
                  <ChevronRight size={14} strokeWidth={2.4} style={{ marginLeft: "-3px" }} />
                </div>
              ) : (
                <GripHorizontal size={18} />
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
