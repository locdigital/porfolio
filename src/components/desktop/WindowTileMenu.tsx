import React from "react";
import type { WindowTilePreset } from "./window-manager";
import { getUiCopy } from "../../i18n/ui";

interface WindowTileMenuProps {
  x: number;
  y: number;
  onSelect: (preset: WindowTilePreset) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MOVE_RESIZE_ITEMS: { preset: WindowTilePreset; label: string; icon: React.ReactNode }[] = [
  {
    preset: "left",
    label: "Left",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="12.5" height="17" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    preset: "right",
    label: "Right",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="19" y="4.5" width="12.5" height="17" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    preset: "top",
    label: "Top",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="27" height="7.5" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    preset: "bottom",
    label: "Bottom",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="14" width="27" height="7.5" rx="2" fill="currentColor" />
      </svg>
    ),
  },
];

const FILL_ARRANGE_ITEMS: { preset: WindowTilePreset; label: string; icon: React.ReactNode }[] = [
  {
    preset: "fill",
    label: "Fill",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="27" height="17" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    preset: "left-right",
    label: "Left & Right",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="12.5" height="17" rx="2" fill="currentColor" />
        <rect x="19" y="4.5" width="12.5" height="17" rx="2" fill="currentColor" fillOpacity="0.45" />
      </svg>
    ),
  },
  {
    preset: "left-two-right",
    label: "Left & 2 Right",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="12.5" height="17" rx="2" fill="currentColor" />
        <rect x="19" y="4.5" width="12.5" height="7.5" rx="1.8" fill="currentColor" fillOpacity="0.45" />
        <rect x="19" y="14" width="12.5" height="7.5" rx="1.8" fill="currentColor" fillOpacity="0.45" />
      </svg>
    ),
  },
  {
    preset: "quarters",
    label: "Quarters",
    icon: (
      <svg viewBox="0 0 36 26" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="33" height="23" rx="4.5" stroke="currentColor" strokeWidth="2.2" />
        <rect x="4.5" y="4.5" width="12.5" height="7.5" rx="1.8" fill="currentColor" />
        <rect x="19" y="4.5" width="12.5" height="7.5" rx="1.8" fill="currentColor" />
        <rect x="4.5" y="14" width="12.5" height="7.5" rx="1.8" fill="currentColor" />
        <rect x="19" y="14" width="12.5" height="7.5" rx="1.8" fill="currentColor" />
      </svg>
    ),
  },
];

export function WindowTileMenu({
  x,
  y,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: WindowTileMenuProps) {
  const copy = getUiCopy().desktop;
  return (
    <div
      role="menu"
      aria-label={copy.tilingAria}
      className="window-tile-menu"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="window-tile-menu__section">
        <div className="window-tile-menu__heading">{copy.moveResize}</div>
        <div className="window-tile-menu__grid">
          {MOVE_RESIZE_ITEMS.map((item) => {
            const label = copy.tileLabels[item.preset] ?? item.label;
            return (
              <button
                key={item.preset}
                type="button"
                role="menuitem"
                className="window-tile-menu__btn"
                title={label}
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.preset);
                }}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      </div>

      <div className="window-tile-menu__divider" role="separator" />

      <div className="window-tile-menu__section">
        <div className="window-tile-menu__heading">{copy.fillArrange}</div>
        <div className="window-tile-menu__grid">
          {FILL_ARRANGE_ITEMS.map((item) => {
            const label = copy.tileLabels[item.preset] ?? item.label;
            return (
              <button
                key={item.preset}
                type="button"
                role="menuitem"
                className="window-tile-menu__btn"
                title={label}
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.preset);
                }}
              >
                {item.icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
