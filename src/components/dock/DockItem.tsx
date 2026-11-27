import { memo, useEffect, useRef, useState } from "react";
import type { AppId, DockApplication, DockPosition } from "./dock.config";
import { DockTooltip } from "./DockTooltip";

interface DockItemProps {
  app: DockApplication;
  position: DockPosition;
  isActive?: boolean;
  isRunning?: boolean;
  onSelect?: (id: AppId) => void;
  onContextMenu?: (id: AppId, rect: DOMRect) => void;
  registerButtonRef?: (id: AppId, el: HTMLButtonElement | null) => void;
}

export const DockItem = memo(function DockItem({
  app,
  position,
  isActive = false,
  isRunning = false,
  onSelect,
  onContextMenu,
  registerButtonRef,
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
      bounceTimerRef.current = window.setTimeout(() => setBouncing(false), 320);
    });
  };

  const handleClick = () => {
    triggerBounce();
    hideTooltip();
    onSelect?.(app.id);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    hideTooltip();
    onContextMenu?.(app.id, event.currentTarget.getBoundingClientRect());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      hideTooltip();
    }
  };

  return (
    <div className="macos-dock-slot">
      <DockTooltip label={app.name} visible={tooltipVisible} position={position} />
      <button
        ref={(el) => registerButtonRef?.(app.id, el)}
        type="button"
        className={`macos-dock-item${isActive ? " is-active" : ""}`}
        aria-label={app.name}
        aria-pressed={isActive}
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`macos-dock-icon-frame${bouncing ? " is-bouncing" : ""}`}
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
});
