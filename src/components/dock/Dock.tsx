import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_DOCK_APPS,
  DEFAULT_DOCK_MOTION,
  type AppId,
  type DockApplication,
  type DockPosition,
} from "./dock.config";
import { AssistiveTouch } from "./AssistiveTouch";
import { DockItem } from "./DockItem";
import { getUiCopy } from "../../i18n/ui";
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
  onOpenSwitcher?: () => void;
  onCloseAllApps?: () => void;
  onQuitApp?: (id: AppId) => void;
  disableBounce?: boolean;
  className?: string;
}

export function Dock({
  apps = DEFAULT_DOCK_APPS,
  position = "left",
  activeApp = null,
  runningApps = [],
  pinnedApps: _pinnedApps = [],
  isPinMode = false,
  onSelectApp,
  onPinApp: _onPinApp,
  onTogglePinMode,
  onOpenSwitcher,
  onCloseAllApps,
  onQuitApp,
  disableBounce = false,
  className = "",
}: DockProps) {
  const copy = getUiCopy().desktop;
  const visibleApps = useMemo(() => apps.filter((app) => app.enabled), [apps]);
  const [isCompact, setIsCompact] = useState(false);
  const effectivePosition: DockPosition = isCompact ? "bottom" : position;
  const buttonRefs = useRef<Map<AppId, HTMLButtonElement>>(new Map());
  const centersRef = useRef<Map<AppId, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
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

  const registerButtonRef = useCallback((id: AppId, el: HTMLButtonElement | null) => {
    if (el) buttonRefs.current.set(id, el);
    else buttonRefs.current.delete(id);
  }, []);

  const cacheSlotCenters = useCallback(() => {
    centersRef.current.clear();
    for (const app of visibleApps) {
      const btn = buttonRefs.current.get(app.id);
      const slot = btn?.parentElement;
      if (!slot) continue;
      const rect = slot.getBoundingClientRect();
      centersRef.current.set(
        app.id,
        effectivePosition === "left" ? rect.top + rect.height / 2 : rect.left + rect.width / 2,
      );
    }
  }, [effectivePosition, visibleApps]);

  const applyMagnification = useCallback(
    (clientX: number, clientY: number) => {
      if (typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.innerWidth < 1024) return;
      if (centersRef.current.size === 0) cacheSlotCenters();

      const radius = DEFAULT_DOCK_MOTION.influenceRadius;
      const maxBoost = DEFAULT_DOCK_MOTION.maxScale - 1;
      const cursor = effectivePosition === "left" ? clientY : clientX;

      for (const app of visibleApps) {
        const btn = buttonRefs.current.get(app.id);
        const center = centersRef.current.get(app.id);
        if (!btn || center === undefined) continue;
        const dist = Math.abs(cursor - center);
        let scale = 1;
        if (dist < radius) {
          const normalized = dist / radius;
          const factor = Math.exp(-3.2 * normalized * normalized);
          scale = Number((1 + maxBoost * factor).toFixed(3));
        }
        const offset = scale > 1 ? Math.round((scale - 1) * 14) : 0;
        btn.style.transform =
          effectivePosition === "left"
            ? `translate3d(${offset}px, 0, 0) scale(${scale})`
            : `translate3d(0, ${-offset}px, 0) scale(${scale})`;
      }
    },
    [cacheSlotCenters, effectivePosition, visibleApps],
  );

  const handlePointerEnter = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      cacheSlotCenters();
    }
  }, [cacheSlotCenters]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const pt = pendingPointerRef.current;
          if (pt) applyMagnification(pt.x, pt.y);
        });
      }
    },
    [applyMagnification],
  );

  const handlePointerLeave = useCallback(() => {
    pendingPointerRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    centersRef.current.clear();
    for (const btn of buttonRefs.current.values()) {
      btn.style.transform = "";
    }
  }, []);

  const handleSelectItem = useCallback(
    (id: AppId) => {
      handlePointerLeave();
      onSelectApp?.(id);
    },
    [handlePointerLeave, onSelectApp],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (visibleApps.length === 0) return null;

  return (
    <>
      <nav
        className={`macos-dock-anchor macos-dock-anchor--${effectivePosition} ${className}`.trim()}
        aria-label={copy.dockAria}
      >
        <div
          className={`macos-dock macos-dock--${effectivePosition}`}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {visibleApps.map((app) => (
            <DockItem
              key={app.id}
              app={app}
              position={effectivePosition}
              isActive={activeApp === app.id}
              isRunning={runningApps.includes(app.id)}
              disableBounce={disableBounce}
              onSelect={handleSelectItem}
              onContextMenu={handleItemContextMenu}
              registerButtonRef={registerButtonRef}
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
              {!isCompact && onTogglePinMode && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="macos-dock-context-menu__item"
                    onClick={() => {
                      onTogglePinMode();
                      setContextMenu(null);
                    }}
                  >
                    {isPinMode ? copy.exitPinMode : copy.pinMode}
                  </button>
                  <div className="macos-dock-context-menu__divider" role="separator" />
                </>
              )}
              {runningApps.includes(contextMenu.id) && onQuitApp ? (
                <button
                  type="button"
                  role="menuitem"
                  className="macos-dock-context-menu__item"
                  onClick={() => {
                    onQuitApp(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  {copy.quit}
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
                  {copy.open}
                </button>
              )}
            </div>,
            document.body,
          )}
      </nav>

      {!isCompact && onTogglePinMode && (
        <AssistiveTouch
          isPinMode={isPinMode}
          onTogglePinMode={onTogglePinMode}
          onOpenSwitcher={onOpenSwitcher}
          onCloseAll={onCloseAllApps}
        />
      )}
    </>
  );
}

export default Dock;
