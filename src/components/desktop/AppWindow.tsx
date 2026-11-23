import React, { useEffect, useRef, useState } from "react";
import { clampWindowOffset, type WindowInstance } from "./window-manager";
import "./desktop.styles.css";

const MIN_WINDOW_WIDTH = 420;
const MIN_WINDOW_HEIGHT = 360;

type ResizeEdge = "e" | "s" | "se";

interface AppWindowProps {
  windowState: WindowInstance;
  title: string;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
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
  onMove,
  children,
}: AppWindowProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
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

  if (!windowState.isOpen) {
    return null;
  }

  const isMinimized = windowState.isMinimized;

  const handleTitlebarPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Only drag on desktop and when not clicking buttons or maximized
    if (window.innerWidth < 1024 || windowState.isMaximized) return;
    if ((e.target as HTMLElement).closest("button")) return;

    onFocus();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: windowState.offsetX,
      origY: windowState.offsetY,
    };
  };

  const handleTitlebarPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragStateRef.current) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
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

    const nextW =
      r.edge === "e" || r.edge === "se"
        ? Math.max(MIN_WINDOW_WIDTH, Math.min(maxW, r.origW + dx))
        : r.origW;
    const nextH =
      r.edge === "s" || r.edge === "se"
        ? Math.max(MIN_WINDOW_HEIGHT, Math.min(maxH, r.origH + dy))
        : r.origH;

    setSize({ width: nextW, height: nextH });

    const nextOffsetX = r.origOffsetX + (nextW - r.origW) / 2;
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

  const transformStyle = windowState.isMaximized
    ? undefined
    : `translate3d(${windowState.offsetX}px, ${windowState.offsetY}px, 0)`;

  const sizeStyle: React.CSSProperties =
    !windowState.isMaximized && size
      ? {
          width: `${size.width}px`,
          height: `${size.height}px`,
          marginLeft: `${-size.width / 2}px`,
          marginTop: `${-size.height / 2}px`,
        }
      : {};

  return (
    <section
      ref={frameRef}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      aria-hidden={isMinimized || undefined}
      className={`desktop-app-window${windowState.isMaximized ? " is-maximized" : ""}${
        isMinimized ? " is-minimized" : ""
      }${isActive && !isMinimized ? " is-active" : " is-inactive"}`}
      style={{
        zIndex: isMinimized ? -1 : 25 + windowState.zIndex,
        transform: transformStyle,
        ...sizeStyle,
      }}
      onPointerDown={onFocus}
    >
      <header
        className="desktop-app-titlebar"
        onPointerDown={handleTitlebarPointerDown}
        onPointerMove={handleTitlebarPointerMove}
        onPointerUp={handleTitlebarPointerUp}
        onDoubleClick={() => {
          if (window.innerWidth >= 1024) onToggleMaximize();
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
              onToggleMaximize();
            }}
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
      </header>

      <div
        className={`desktop-app-body${isScrolling ? " is-scrolling" : ""}`}
        onScroll={handleBodyScroll}
      >
        {children}
      </div>

      {!windowState.isMaximized && (
        <>
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
            className="desktop-resize-handle desktop-resize-handle--se"
            onPointerDown={handleResizePointerDown("se")}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            title="Drag to resize"
            aria-hidden="true"
          >
            <svg
              className="desktop-resize-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 3.5H12.5V6.5" />
              <path d="M6.5 12.5H3.5V9.5" />
              <path d="M12.5 3.5L3.5 12.5" />
            </svg>
          </div>
        </>
      )}
    </section>
  );
}
