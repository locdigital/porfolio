import { useCallback, useEffect, useRef, useState } from "react";
import { Layers, Pin, PinOff, Search, X } from "lucide-react";

export interface AssistiveTouchProps {
  isPinMode: boolean;
  onTogglePinMode: () => void;
  onOpenSwitcher?: () => void;
  onCloseAll?: () => void;
}

const BUTTON_SIZE = 38;
const EDGE_MARGIN = 10;
const POS_STORAGE_KEY = "assistive-touch-pos-v1";

function clampPosition(x: number, y: number) {
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - BUTTON_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN);
  return {
    x: Math.max(EDGE_MARGIN, Math.min(maxX, x)),
    y: Math.max(EDGE_MARGIN, Math.min(maxY, y)),
  };
}

export function AssistiveTouch({
  isPinMode,
  onTogglePinMode,
  onOpenSwitcher,
  onCloseAll,
}: AssistiveTouchProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerHandledClickRef = useRef(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  // Restore saved free-floating position across reloads
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(POS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.x === "number" &&
        typeof parsed.y === "number" &&
        Number.isFinite(parsed.x) &&
        Number.isFinite(parsed.y)
      ) {
        setPos(clampPosition(parsed.x, parsed.y));
      }
    } catch {}
  }, []);

  // Close menu on outside pointerdown, Escape, or viewport resize
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const handleResize = () => setMenuOpen(false);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpen]);

  // Keep free-floating position clamped inside viewport on resize
  useEffect(() => {
    if (!pos) return;
    const handleResize = () => {
      setPos((prev) => (prev ? clampPosition(prev.x, prev.y) : null));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pos]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerHandledClickRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors on synthetic or unsupported pointers.
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.moved = true;
      setIsDragging(true);
      setMenuOpen(false);
    }
    setPos(clampPosition(drag.origX + dx, drag.origY + dy));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    pointerHandledClickRef.current = true;
    if (drag.moved) {
      setIsDragging(false);
      const finalPos = clampPosition(
        drag.origX + (e.clientX - drag.startX),
        drag.origY + (e.clientY - drag.startY),
      );
      setPos(finalPos);
      try {
        sessionStorage.setItem(POS_STORAGE_KEY, JSON.stringify(finalPos));
      } catch {}
    } else {
      setMenuOpen((open) => !open);
    }
  }, []);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  }, []);

  const handleButtonClick = useCallback(() => {
    if (pointerHandledClickRef.current) {
      pointerHandledClickRef.current = false;
      return;
    }
    setMenuOpen((open) => !open);
  }, []);

  const handleOpenSearch = useCallback(() => {
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("workspace-command-search:toggle"));
  }, []);

  const isOnRightEdge =
    typeof window !== "undefined" && pos !== null && pos.x + BUTTON_SIZE / 2 > window.innerWidth / 2;
  const isNearTop =
    typeof window !== "undefined" && pos !== null && pos.y < 210;

  const anchorStyle: React.CSSProperties | undefined = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, bottom: "auto" }
    : undefined;

  return (
    <div
      ref={rootRef}
      className={`assistive-touch-anchor${isDragging ? " is-dragging" : ""}${menuOpen ? " is-open" : ""}`}
      style={anchorStyle}
    >
      {menuOpen && (
        <div
          role="menu"
          aria-label="AssistiveTouch menu"
          className={`assistive-touch-menu${isOnRightEdge ? " is-right" : ""}${isNearTop ? " is-below" : ""}`}
        >
          <button
            type="button"
            role="menuitem"
            className={`assistive-touch-action${isPinMode ? " is-active" : ""}`}
            onClick={() => {
              onTogglePinMode();
              setMenuOpen(false);
            }}
          >
            <span className="assistive-touch-action-icon">
              {isPinMode ? <PinOff size={17} strokeWidth={1.9} /> : <Pin size={17} strokeWidth={1.9} />}
            </span>
            <span className="assistive-touch-action-label">
              {isPinMode ? "Exit Pin" : "Pin Mode"}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="assistive-touch-action"
            onClick={() => {
              setMenuOpen(false);
              onOpenSwitcher?.();
            }}
          >
            <span className="assistive-touch-action-icon">
              <Layers size={17} strokeWidth={1.9} />
            </span>
            <span className="assistive-touch-action-label">Switcher</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="assistive-touch-action"
            onClick={handleOpenSearch}
          >
            <span className="assistive-touch-action-icon">
              <Search size={17} strokeWidth={1.9} />
            </span>
            <span className="assistive-touch-action-label">Search</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="assistive-touch-action"
            onClick={() => {
              setMenuOpen(false);
              onCloseAll?.();
            }}
          >
            <span className="assistive-touch-action-icon">
              <X size={17} strokeWidth={2} />
            </span>
            <span className="assistive-touch-action-label">Close All</span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`assistive-touch-btn${isPinMode ? " is-pin-active" : ""}${menuOpen ? " is-open" : ""}`}
        aria-label="AssistiveTouch"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span className="assistive-touch-ring assistive-touch-ring--outer" aria-hidden="true">
          <span className="assistive-touch-ring assistive-touch-ring--mid">
            <span className="assistive-touch-dot" />
          </span>
        </span>
      </button>
    </div>
  );
}
