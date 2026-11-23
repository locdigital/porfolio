import { useEffect } from "react";
import type { AppId, DockApplication } from "../dock/dock.config";

interface AppSwitcherProps {
  isOpen: boolean;
  apps: DockApplication[];
  selectedIndex: number;
  runningApps: AppId[];
  onSelectIndex: (index: number) => void;
  onCommit: (id: AppId) => void;
  onClose: () => void;
}

export function AppSwitcher({
  isOpen,
  apps,
  selectedIndex,
  runningApps,
  onSelectIndex,
  onCommit,
  onClose,
}: AppSwitcherProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSelectIndex((selectedIndex + 1) % apps.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSelectIndex((selectedIndex - 1 + apps.length) % apps.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const app = apps[selectedIndex];
        if (app) onCommit(app.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [apps, isOpen, onClose, onCommit, onSelectIndex, selectedIndex]);

  if (!isOpen) return null;

  const selectedApp = apps[selectedIndex] ?? apps[0];

  return (
    <div
      className="macos-switcher-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="App Switcher"
    >
      <div
        className="macos-switcher-hud"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="macos-switcher-grid">
          {apps.map((app, index) => {
            const isSelected = index === selectedIndex;
            const isRunning = runningApps.includes(app.id);
            return (
              <button
                key={app.id}
                type="button"
                className={`macos-switcher-item${isSelected ? " is-selected" : ""}`}
                onMouseEnter={() => onSelectIndex(index)}
                onClick={() => onCommit(app.id)}
                aria-label={`Switch to ${app.name}`}
              >
                <span
                  className="macos-switcher-icon-wrap"
                  style={
                    app.iconBackground
                      ? { backgroundColor: app.iconBackground }
                      : undefined
                  }
                >
                  <img
                    src={app.icon}
                    alt=""
                    className={`macos-switcher-icon${
                      app.iconFit === "contain" ? " is-contain" : ""
                    }`}
                  />
                </span>
                <span className="macos-switcher-label">{app.name}</span>
                {isRunning && (
                  <span className="macos-switcher-dot" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <div className="macos-switcher-footer">
          <span className="macos-switcher-active-name">{selectedApp?.name}</span>
          <span className="macos-switcher-hint">
            ⌥ Tab / Click to switch · Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}
