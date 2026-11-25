import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  clampWindowOffset,
  getTileGeometryStyle,
  getWindowZIndex,
  type WindowInstance,
  type WindowTilePreset,
} from "./window-manager";
import { WindowTileMenu } from "./WindowTileMenu";
import "./desktop.styles.css";

const MIN_WINDOW_WIDTH = 420;
const MIN_WINDOW_HEIGHT = 360;

type ResizeEdge = "e" | "w" | "s" | "se" | "sw";

interface AppWindowProps {
  windowState: WindowInstance;
  title: string;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onTogglePin: () => void;
  onTile: (preset: WindowTilePreset) => void;
  onMove: (offsetX: number, offsetY: number) => void;
  children: React.ReactNode;
}

export function AppWindow({
  windowState,
  title,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onTogglePin,
  onTile,
  onMove,
  children,
}: AppWindowProps) {
  // Restore minimized sessions without initializing an app until its first visible frame.
  const hasShownContent = useRef(false);
  useEffect(() => {
    if (!windowState.isOpen) hasShownContent.current = false;
    else if (!windowState.isMinimized) hasShownContent.current = true;
  }, [windowState.isOpen, windowState.isMinimized]);
  const frameRef = useRef<HTMLElement | null>(null);
  const isVisible = windowState.isOpen && !windowState.isMinimized;
  const [isPresented, setIsPresented] = useState(isVisible);
  const isExiting = !isVisible && isPresented;
  const presentedWindow = useRef(windowState);
  const frameState = isExiting ? presentedWindow.current : windowState;

  useLayoutEffect(() => {
    if (isVisible) presentedWindow.current = windowState;
  }, [isVisible, windowState]);

  useLayoutEffect(() => {
    if (isVisible || !isExiting) {
      if (isVisible) setIsPresented(true);
      return;
    }
    const exit = frameRef.current?.getAnimations?.().find(
      (animation) => "animationName" in animation && animation.animationName === "workspace-window-exit",
    );
    if (!exit) {
      setIsPresented(false);
      return;
    }
    let interrupted = false;
    const finish = () => {
      if (!interrupted) setIsPresented(false);
    };
    void exit.finished.then(finish, finish);
    return () => { interrupted = true; };
  }, [isExiting, isVisible]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCompactViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [tileMenu, setTileMenu] = useState<{ x: number; y: number } | null>(null);
  const tileOpenTimerRef = useRef<number | null>(null);
  const tileCloseTimerRef = useRef<number | null>(null);
  const scrollTimerRef = useRef<number | null>(null);

  const clearTileTimers = () => {
    if (tileOpenTimerRef.current !== null) {
      window.clearTimeout(tileOpenTimerRef.current);
      tileOpenTimerRef.current = null;
    }
    if (tileCloseTimerRef.current !== null) {
      window.clearTimeout(tileCloseTimerRef.current);
      tileCloseTimerRef.current = null;
    }
  };

  const scheduleTileMenuOpen = (btn: HTMLButtonElement) => {
    if (window.innerWidth < 1024) return;
    clearTileTimers();
    const rect = btn.getBoundingClientRect();
    tileOpenTimerRef.current = window.setTimeout(() => {
      const menuW = 248;
      const x = Math.max(8, Math.min(rect.left - 18, window.innerWidth - menuW - 8));
      const y = Math.min(rect.bottom + 10, window.innerHeight - 190);
      setTileMenu({ x, y });
    }, 220);
  };

  const scheduleTileMenuClose = () => {
    clearTileTimers();
    tileCloseTimerRef.current = window.setTimeout(() => {
      setTileMenu(null);
    }, 180);
  };

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

  useEffect(() => {
    return () => {
      clearTileTimers();
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const handleBodyScroll = () => {
    setIsScrolling(true);
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimerRef.current = null;
    }, 900);
  };
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    dragging: boolean;
  } | null>(null);
  const resizeStateRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    origOffsetX: number;
    origOffsetY: number;
  } | null>(null);

  if (!windowState.isOpen && !isExiting) {
    return null;
  }

  const isMinimized = windowState.isMinimized && !isExiting;

  const handleTitlebarPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Only drag on desktop and when not clicking buttons or maximized
    if (e.button !== 0) return;
    if (window.innerWidth < 1024 || windowState.isMaximized) return;
    if ((e.target as Element).closest("button, a, input, select, textarea")) return;

    onFocus();
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: windowState.offsetX,
      origY: windowState.offsetY,
      dragging: false,
    };
  };

  const handleTitlebarPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragStateRef.current) return;
    if (e.buttons !== 1) {
      dragStateRef.current = null;
      return;
    }
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    if (!dragStateRef.current.dragging) {
      if (Math.hypot(dx, dy) < 5) return;
      dragStateRef.current.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = frameRef.current?.getBoundingClientRect();
    const clamped = clampWindowOffset(
      dragStateRef.current.origX + dx,
      dragStateRef.current.origY + dy,
      window.innerWidth,
      window.innerHeight,
      rect?.width ?? 1140,
      rect?.height ?? 720,
    );
    onMove(clamped.offsetX, clamped.offsetY);
  };

  const handleTitlebarPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleResizePointerDown =
    (edge: ResizeEdge) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (window.innerWidth < 1024 || windowState.isMaximized) return;
      e.stopPropagation();
      onFocus();
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeStateRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origW: rect.width,
        origH: rect.height,
        origOffsetX: windowState.offsetX,
        origOffsetY: windowState.offsetY,
      };
    };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = resizeStateRef.current;
    if (!r) return;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    const maxW = Math.max(MIN_WINDOW_WIDTH, window.innerWidth - 88);
    const maxH = Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - 40);

    const isEast = r.edge === "e" || r.edge === "se";
    const isWest = r.edge === "w" || r.edge === "sw";
    const isSouth = r.edge === "s" || r.edge === "se" || r.edge === "sw";

    const nextW = isEast
      ? Math.max(MIN_WINDOW_WIDTH, Math.min(maxW, r.origW + dx))
      : isWest
        ? Math.max(MIN_WINDOW_WIDTH, Math.min(maxW, r.origW - dx))
        : r.origW;
    const nextH = isSouth
      ? Math.max(MIN_WINDOW_HEIGHT, Math.min(maxH, r.origH + dy))
      : r.origH;

    setSize({ width: nextW, height: nextH });

    const nextOffsetX = isWest
      ? r.origOffsetX - (nextW - r.origW) / 2
      : r.origOffsetX + (nextW - r.origW) / 2;
    const nextOffsetY = r.origOffsetY + (nextH - r.origH) / 2;
    onMove(nextOffsetX, nextOffsetY);
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStateRef.current) return;
    resizeStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const isTiled = !isCompactViewport && !frameState.isMaximized && frameState.tile !== null;

  const transformStyle =
    isCompactViewport || frameState.isMaximized || isTiled
      ? undefined
      : `translate3d(${frameState.offsetX}px, ${frameState.offsetY}px, 0)`;

  const sizeStyle: React.CSSProperties = isCompactViewport
    ? {}
    : isTiled && frameState.tile
      ? getTileGeometryStyle(frameState.tile)
      : !frameState.isMaximized && size
        ? {
            width: `${size.width}px`,
            height: `${size.height}px`,
            marginLeft: `${-size.width / 2}px`,
            marginTop: `${-size.height / 2}px`,
          }
        : {};

  const handleTitlebarContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const menuWidth = 190;
    const menuHeight = 44;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ x: Math.max(8, x), y: Math.max(8, y) });
  };

  return (
    <>
    <section
      ref={frameRef}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      aria-hidden={!isVisible || undefined}
      inert={!isVisible}
      className={`desktop-app-window${frameState.isMaximized ? " is-maximized" : ""}${
        isTiled ? " is-tiled" : ""
      }${isMinimized ? " is-minimized" : ""}${isExiting ? " is-exiting" : ""}${
        isActive && !isMinimized ? " is-active" : " is-inactive"
      }`}
      style={{
        zIndex: getWindowZIndex(frameState),
        transform: transformStyle,
        ...sizeStyle,
      }}
      onPointerDown={onFocus}
      onFocus={onFocus}
    >
      <header
        className="desktop-app-titlebar"
        onPointerDown={handleTitlebarPointerDown}
        onPointerMove={handleTitlebarPointerMove}
        onPointerUp={handleTitlebarPointerUp}
        onPointerCancel={handleTitlebarPointerUp}
        onContextMenu={handleTitlebarContextMenu}
        onClick={(event) => {
          if ((event.target as Element).closest("button, a, input, select, textarea")) return;
          onFocus();
        }}
        onDoubleClick={(event) => {
          if (window.innerWidth < 1024) return;
          if ((event.target as Element).closest("button, a, input, select, textarea")) return;
          event.preventDefault();
          onToggleMaximize();
        }}
      >
        <div className="mac-traffic-lights" aria-label="Window controls">
          <button
            className="mac-dot mac-dot-close"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={`Close ${title}`}
            title={`Close ${title}`}
          >
            <svg className="mac-control-icon" viewBox="0 0 48 48" aria-hidden="true">
              <use href="/assets/icons/all-three.svg#window-close"></use>
            </svg>
          </button>
          <button
            className="mac-dot mac-dot-minimize"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            aria-label={`Minimize ${title}`}
            title={`Minimize ${title}`}
          >
            <svg className="mac-control-icon" viewBox="0 0 48 48" aria-hidden="true">
              <use href="/assets/icons/all-three.svg#window-minimize"></use>
            </svg>
          </button>
          <button
            className="mac-dot mac-dot-maximize"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearTileTimers();
              setTileMenu(null);
              onToggleMaximize();
            }}
            onMouseEnter={(e) => scheduleTileMenuOpen(e.currentTarget)}
            onMouseLeave={scheduleTileMenuClose}
            aria-label={windowState.isMaximized ? `Restore ${title}` : `Maximize ${title}`}
            aria-pressed={windowState.isMaximized}
            title={windowState.isMaximized ? `Restore ${title}` : `Maximize ${title}`}
          >
            <svg className="mac-control-icon" viewBox="0 0 48 48" aria-hidden="true">
              <use href="/assets/icons/all-three.svg#window-maximize"></use>
            </svg>
          </button>
        </div>

        <div className="desktop-titlebar-title">
          <span>{title}</span>
        </div>

        <button
          type="button"
          className="desktop-app-mobile-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={`Close ${title}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div
        className={`desktop-app-body${isScrolling ? " is-scrolling" : ""}`}
        onScroll={handleBodyScroll}
      >
        {(!isMinimized || hasShownContent.current) && children}
      </div>

      {!windowState.isMaximized && (
        <>
          <div
            className="desktop-resize-handle desktop-resize-handle--w"
            onPointerDown={handleResizePointerDown("w")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="desktop-resize-handle desktop-resize-handle--e"
            onPointerDown={handleResizePointerDown("e")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="desktop-resize-handle desktop-resize-handle--s"
            onPointerDown={handleResizePointerDown("s")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="desktop-resize-handle desktop-resize-handle--sw"
            onPointerDown={handleResizePointerDown("sw")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            aria-hidden="true"
          />
          <div
            className="desktop-resize-handle desktop-resize-handle--se"
            onPointerDown={handleResizePointerDown("se")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            aria-hidden="true"
          />
        </>
      )}
    </section>

    {tileMenu && (
      <WindowTileMenu
        x={tileMenu.x}
        y={tileMenu.y}
        onMouseEnter={clearTileTimers}
        onMouseLeave={scheduleTileMenuClose}
        onSelect={(preset) => {
          clearTileTimers();
          setTileMenu(null);
          onTile(preset);
        }}
      />
    )}

    {contextMenu && (
      <div
        ref={menuRef}
        role="menu"
        className="desktop-context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={windowState.isPinned}
          className={`desktop-context-menu__item${windowState.isPinned ? " is-checked" : ""}`}
          onClick={() => {
            onTogglePin();
            setContextMenu(null);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 17v5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
          <span>{windowState.isPinned ? "Unpin widget" : "Pin as widget"}</span>
        </button>
      </div>
    )}
    </>
  );
}
