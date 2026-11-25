import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_DOCK_APPS,
  DEFAULT_DOCK_MOTION,
  type AppId,
  type DockApplication,
  type DockPosition,
} from "./dock.config";
import { DockItem } from "./DockItem";
import "./dock.styles.css";

export interface DockProps {
  apps?: DockApplication[];
  position?: DockPosition;
  activeApp?: AppId | null;
  runningApps?: AppId[];
  pinnedApps?: AppId[];
  isPinMode?: boolean;
  onSelectApp?: (id: AppId) => void;
  onPinApp?: (id: AppId) => void;
  onTogglePinMode?: () => void;
  onQuitApp?: (id: AppId) => void;
  className?: string;
}

export function Dock({
  apps = DEFAULT_DOCK_APPS,
  position = "left",
  activeApp = null,
  runningApps = [],
  pinnedApps = [],
  isPinMode = false,
  onSelectApp,
  onPinApp,
  onTogglePinMode,
  onQuitApp,
  className = "",
}: DockProps) {
  const visibleApps = useMemo(() => apps.filter((app) => app.enabled), [apps]);
  const [isCompact, setIsCompact] = useState(false);
  const effectivePosition: DockPosition = isCompact ? "bottom" : position;
  const [pointerPos, setPointerPos] = useState<number | null>(null);
  const slotRefs = useRef<Map<AppId, HTMLDivElement>>(new Map());
  const [scales, setScales] = useState<Record<string, number>>({});
  const [contextMenu, setContextMenu] = useState<{
    id: AppId;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    const handleClose = () => setContextMenu(null);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleClose);
    };
  }, [contextMenu]);

  const handleItemContextMenu = useCallback(
    (id: AppId, rect: DOMRect) => {
      if (effectivePosition === "left") {
        setContextMenu({
          id,
          x: rect.right + 14,
          y: rect.top + rect.height / 2,
        });
      } else {
        const clampedX = Math.max(
          64,
          Math.min(rect.left + rect.width / 2, window.innerWidth - 64),
        );
        setContextMenu({
          id,
          x: clampedX,
          y: rect.top - 10,
        });
      }
    },
    [effectivePosition],
  );

  const registerSlotRef = useCallback((id: AppId, el: HTMLDivElement | null) => {
    if (el) slotRefs.current.set(id, el);
    else slotRefs.current.delete(id);
  }, []);

  const updateScales = useCallback(
    (clientX: number, clientY: number) => {
      if (typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.innerWidth < 1024) return;

      const radius = DEFAULT_DOCK_MOTION.influenceRadius;
      const maxBoost = DEFAULT_DOCK_MOTION.maxScale - 1;
      const next: Record<string, number> = {};

      for (const app of visibleApps) {
        const el = slotRefs.current.get(app.id);
        if (!el) {
          next[app.id] = 1;
          continue;
        }
        const rect = el.getBoundingClientRect();
        const center = position === "left" ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
        const cursor = position === "left" ? clientY : clientX;
        const dist = Math.abs(cursor - center);
        if (dist >= radius) {
          next[app.id] = 1;
        } else {
          // Smooth Gaussian falloff
          const normalized = dist / radius;
          const factor = Math.exp(-3.2 * normalized * normalized);
          next[app.id] = Number((1 + maxBoost * factor).toFixed(3));
        }
      }
      setScales(next);
    },
    [position, visibleApps],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      setPointerPos(position === "left" ? e.clientY : e.clientX);
      updateScales(e.clientX, e.clientY);
    },
    [position, updateScales],
  );

  const handlePointerLeave = useCallback(() => {
    setPointerPos(null);
    setScales({});
  }, []);

  if (visibleApps.length === 0) return null;

  return (
    <nav
      className={`macos-dock-anchor macos-dock-anchor--${effectivePosition} ${className}`.trim()}
      aria-label="Applications Dock"
    >
      <div
        className={`macos-dock macos-dock--${effectivePosition}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {visibleApps.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            position={effectivePosition}
            scale={pointerPos !== null ? (scales[app.id] ?? 1) : 1}
            isActive={activeApp === app.id}
            isRunning={runningApps.includes(app.id)}
            onSelect={onSelectApp}
            onContextMenu={handleItemContextMenu}
            registerSlotRef={registerSlotRef}
          />
        ))}
      </div>

      {contextMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={`macos-dock-context-menu macos-dock-context-menu--${effectivePosition}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {!isCompact && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="macos-dock-context-menu__item"
                  onClick={() => {
                    onTogglePinMode?.();
                    setContextMenu(null);
                  }}
                >
                  {isPinMode ? "Exit pin mode" : "Pin mode"}
                </button>
                <div className="macos-dock-context-menu__divider" role="separator" />
              </>
            )}
            {runningApps.includes(contextMenu.id) ? (
              <button
                type="button"
                role="menuitem"
                className="macos-dock-context-menu__item"
                onClick={() => {
                  onQuitApp?.(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                Quit
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="macos-dock-context-menu__item"
                onClick={() => {
                  onSelectApp?.(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                Open
              </button>
            )}
          </div>,
          document.body,
        )}
    </nav>
  );
}

export default Dock;
