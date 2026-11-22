import { useEffect, useRef, useState } from "react";
import type { AppId, DockApplication, DockPosition } from "./dock.config";
import { DockTooltip } from "./DockTooltip";

interface DockItemProps {
  app: DockApplication;
  position: DockPosition;
  scale?: number;
  isActive?: boolean;
  isRunning?: boolean;
  onSelect?: (id: AppId) => void;
  registerSlotRef?: (id: AppId, el: HTMLDivElement | null) => void;
}

export function DockItem({
  app,
  position,
  scale = 1,
  isActive = false,
  isRunning = false,
  onSelect,
  registerSlotRef,
}: DockItemProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const bounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
      if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
    };
  }, []);

  const showTooltip = () => {
    if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setTooltipVisible(true), 80);
  };

  const hideTooltip = () => {
    if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    setTooltipVisible(false);
  };

  const triggerBounce = () => {
    setBouncing(false);
    requestAnimationFrame(() => {
      setBouncing(true);
      if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = window.setTimeout(() => setBouncing(false), 340);
    });
  };

  const handleClick = () => {
    triggerBounce();
    hideTooltip();
    onSelect?.(app.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      hideTooltip();
    }
  };

  const translateOffset = scale > 1 ? Math.round((scale - 1) * 14) : 0;
  const iconTransform =
    position === "left"
      ? `translate3d(${translateOffset}px, 0, 0) scale(${scale})`
      : `translate3d(0, ${-translateOffset}px, 0) scale(${scale})`;

  return (
    <div
      className="macos-dock-slot"
      ref={(el) => registerSlotRef?.(app.id, el)}
    >
      <DockTooltip label={app.name} visible={tooltipVisible} position={position} />
      <button
        type="button"
        className={`macos-dock-item${bouncing ? " is-bouncing" : ""}${isActive ? " is-active" : ""}`}
        aria-label={app.name}
        aria-pressed={isActive}
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          transform: iconTransform,
        }}
      >
        <span
          className="macos-dock-icon-frame"
          style={app.iconBackground ? { backgroundColor: app.iconBackground } : undefined}
        >
          <img
            src={app.icon}
            alt=""
            className={`macos-dock-icon-img${app.iconFit === "contain" ? " is-contain" : ""}`}
            width={64}
            height={64}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </span>
      </button>
      {(isRunning || isActive) && (
        <span
          className={`macos-dock-indicator${isActive ? " is-active" : ""}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
