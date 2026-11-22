import type { DockPosition } from "./dock.config";

interface DockTooltipProps {
  label: string;
  visible: boolean;
  position: DockPosition;
}

export function DockTooltip({ label, visible, position }: DockTooltipProps) {
  return (
    <span
      role="tooltip"
      className={`macos-dock-tooltip macos-dock-tooltip--${position}${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      {label}
    </span>
  );
}
