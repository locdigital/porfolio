import React, { useRef } from "react";
import { clampWindowOffset, type WindowInstance } from "./window-manager";
import "./desktop.styles.css";

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
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
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

  const transformStyle = windowState.isMaximized
    ? undefined
    : `translate3d(${windowState.offsetX}px, ${windowState.offsetY}px, 0)`;

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

      <div className="desktop-app-body">{children}</div>
    </section>
  );
}
