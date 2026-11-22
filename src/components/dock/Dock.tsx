import { useCallback, useMemo, useRef, useState } from "react";
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
  onSelectApp?: (id: AppId) => void;
  className?: string;
}

export function Dock({
  apps = DEFAULT_DOCK_APPS,
  position = "left",
  activeApp = null,
  runningApps = [],
  onSelectApp,
  className = "",
}: DockProps) {
  const visibleApps = useMemo(() => apps.filter((app) => app.enabled), [apps]);
  const [pointerPos, setPointerPos] = useState<number | null>(null);
  const slotRefs = useRef<Map<AppId, HTMLDivElement>>(new Map());
  const [scales, setScales] = useState<Record<string, number>>({});

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
      className={`macos-dock-anchor macos-dock-anchor--${position} ${className}`.trim()}
      aria-label="Applications Dock"
    >
      <div
        className={`macos-dock macos-dock--${position}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {visibleApps.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            position={position}
            scale={pointerPos !== null ? (scales[app.id] ?? 1) : 1}
            isActive={activeApp === app.id}
            isRunning={runningApps.includes(app.id)}
            onSelect={onSelectApp}
            registerSlotRef={registerSlotRef}
          />
        ))}
      </div>
    </nav>
  );
}

export default Dock;
