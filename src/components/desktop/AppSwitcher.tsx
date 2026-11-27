import type { AppId, DockApplication } from "../dock/dock.config";
import { getUiCopy } from "../../i18n/ui";

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
  if (!isOpen) return null;

  const copy = getUiCopy().desktop;
  const selectedApp = apps[selectedIndex] ?? apps[0];

  return (
    <div
      className="macos-switcher-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={copy.switcherAria}
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
                aria-label={copy.switchTo(app.name)}
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
                    className={`macos-switcher-icon${app.iconFit === "contain" ? " is-contain" : ""
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
            {copy.switcherHint}
          </span>
        </div>
      </div>
    </div>
  );
}
