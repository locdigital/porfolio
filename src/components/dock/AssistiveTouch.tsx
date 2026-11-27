import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Keyboard, Layers, Pin, PinOff, X } from "lucide-react";
import { getUiCopy } from "../../i18n/ui";

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
  const copy = getUiCopy().desktop;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"actions" | "shortcuts">("actions");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const suppressClickUntilRef = useRef(0);
  const cleanupDragListenersRef = useRef<(() => void) | null>(null);

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
    } catch { }
  }, []);

  // Cleanup any active drag listeners on unmount
  useEffect(() => {
    return () => {
      cleanupDragListenersRef.current?.();
      cleanupDragListenersRef.current = null;
    };
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
    cleanupDragListenersRef.current?.();

    const rect = e.currentTarget.getBoundingClientRect();
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = rect.left;
    const origY = rect.top;
    let moved = false;

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      if (cleanupDragListenersRef.current === cleanup) {
        cleanupDragListenersRef.current = null;
      }
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved) {
        if (Math.hypot(dx, dy) < 6) return;
        moved = true;
        setIsDragging(true);
        setMenuOpen(false);
      }
      setPos(clampPosition(origX + dx, origY + dy));
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
      if (moved) {
        suppressClickUntilRef.current = performance.now() + 300;
        setIsDragging(false);
        const finalPos = clampPosition(
          origX + (ev.clientX - startX),
          origY + (ev.clientY - startY),
        );
        setPos(finalPos);
        try {
          sessionStorage.setItem(POS_STORAGE_KEY, JSON.stringify(finalPos));
        } catch { }
      }
    };

    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
      if (moved) {
        suppressClickUntilRef.current = performance.now() + 300;
        setIsDragging(false);
      }
    };

    cleanupDragListenersRef.current = cleanup;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }, []);

  const handleButtonClick = useCallback(() => {
    if (performance.now() < suppressClickUntilRef.current) {
      return;
    }
    setMenuOpen((open) => !open);
  }, []);

  // Each reopen starts from the action grid, not a stale shortcuts view.
  useEffect(() => {
    if (!menuOpen) setMenuView("actions");
  }, [menuOpen]);

  const modKey =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
      ? "⌘"
      : "Ctrl";
  const shortcuts: { keys: string[]; label: string }[] = [
    { keys: [modKey, "K"], label: copy.shortcutList.search },
    { keys: ["Tab"], label: copy.shortcutList.nextApp },
    { keys: ["⇧", "Tab"], label: copy.shortcutList.prevApp },
    { keys: ["←", "→"], label: copy.shortcutList.switcherMove },
    { keys: ["Enter"], label: copy.shortcutList.switcherOpen },
    { keys: ["Esc"], label: copy.shortcutList.escape },
  ];

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
      onPointerDown={(e) => e.stopPropagation()}
    >
      {menuOpen && menuView === "shortcuts" && (
        <div
          role="dialog"
          aria-label={copy.shortcutsTitle}
          className={`assistive-touch-menu assistive-touch-shortcuts${isOnRightEdge ? " is-right" : ""}${isNearTop ? " is-below" : ""}`}
        >
          <div className="assistive-touch-shortcuts-head">
            <button
              type="button"
              className="assistive-touch-shortcuts-back"
              aria-label={copy.shortcutsBack}
              onClick={() => setMenuView("actions")}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span>{copy.shortcutsTitle}</span>
          </div>
          <ul className="assistive-touch-shortcuts-list">
            {shortcuts.map((item) => (
              <li key={item.label}>
                <span className="assistive-touch-shortcuts-label">{item.label}</span>
                <span className="assistive-touch-shortcuts-keys">
                  {item.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {menuOpen && menuView === "actions" && (
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
              {isPinMode ? copy.exitPinShort : copy.pinShort}
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
            <span className="assistive-touch-action-label">{copy.switcher}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="assistive-touch-action"
            onClick={() => setMenuView("shortcuts")}
          >
            <span className="assistive-touch-action-icon">
              <Keyboard size={17} strokeWidth={1.9} />
            </span>
            <span className="assistive-touch-action-label">{copy.shortcuts}</span>
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
            <span className="assistive-touch-action-label">{copy.closeAll}</span>
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
