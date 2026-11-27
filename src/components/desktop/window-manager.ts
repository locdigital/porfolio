import { getAppRoute, type AppId } from "../dock/dock.config";

export interface WindowTileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type WindowTilePreset =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "fill"
  | "left-right"
  | "left-two-right"
  | "quarters";

export interface WindowInstance {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  tile: WindowTileRect | null;
  zIndex: number;
  offsetX: number;
  offsetY: number;
}

export interface WindowManagerState {
  windows: Record<AppId, WindowInstance>;
  activeApp: AppId | null;
  topZ: number;
  /**
   * Pin Mode bento order: index 0 is the large centre window, 1-3 are the
   * widget slots (top → bottom). `null` whenever Pin Mode is not active.
   */
  pinLayout?: AppId[] | null;
}

// All app surfaces share one stack. Pinning changes presentation, not priority.
export function getWindowZIndex(window: WindowInstance): number {
  return window.isMinimized ? -1 : 25 + window.zIndex;
}

export function getTileGeometryStyle(tile: WindowTileRect): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  const gapLeft = tile.x > 0 ? 5 : 0;
  const gapRight = tile.x + tile.w < 1 ? 5 : 0;
  const gapTop = tile.y > 0 ? 5 : 0;
  const gapBottom = tile.y + tile.h < 1 ? 5 : 0;
  return {
    left: `calc(84px + (100vw - 96px) * ${tile.x} + ${gapLeft}px)`,
    top: `calc(12px + (100dvh - 24px) * ${tile.y} + ${gapTop}px)`,
    width: `calc((100vw - 96px) * ${tile.w} - ${gapLeft + gapRight}px)`,
    height: `calc((100dvh - 24px) * ${tile.h} - ${gapTop + gapBottom}px)`,
  };
}

export type WindowAction =
  | { type: "OPEN_APP"; id: AppId }
  | { type: "CLOSE_APP"; id: AppId }
  | { type: "CLOSE_ALL_APPS" }
  | { type: "MINIMIZE_APP"; id: AppId }
  | { type: "TOGGLE_MAXIMIZE_APP"; id: AppId }
  | { type: "SET_MAXIMIZED_APP"; id: AppId; isMaximized: boolean }
  | { type: "TOGGLE_PIN_APP"; id: AppId }
  | { type: "TOGGLE_PIN_MODE"; hostApp?: AppId }
  | { type: "FOCUS_PIN_APP"; id: AppId }
  | { type: "TILE_WINDOW"; id: AppId; preset: WindowTilePreset }
  | { type: "FOCUS_APP"; id: AppId }
  | { type: "MOVE_WINDOW"; id: AppId; offsetX: number; offsetY: number }
  | { type: "SYNC_ROUTE"; pathname: string }
  | { type: "RESTORE_STATE"; state: WindowManagerState };

const ALL_APP_IDS: AppId[] = ["netflix", "spotify", "photos", "workspace", "photoshop"];

const DEFAULT_OFFSETS: Record<AppId, { x: number; y: number }> = {
  workspace: { x: 0, y: 0 },
  netflix: { x: -32, y: -20 },
  spotify: { x: 32, y: 18 },
  photos: { x: -18, y: 24 },
  photoshop: { x: 44, y: -16 },
};

export function getDefaultAppForPath(pathname: string): AppId {
  pathname = pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/entertainment/netflix" || pathname.startsWith("/entertainment/netflix/")) {
    return "netflix";
  }
  if (pathname === "/music/spotify" || pathname.startsWith("/music/spotify/")) {
    return "spotify";
  }
  if (pathname === "/color-lab/nikon-recipes" || pathname.startsWith("/color-lab/nikon-recipes/")) {
    return "photoshop";
  }
  return pathname === "/photos" || pathname.startsWith("/photos/") ? "photos" : "workspace";
}

// All dock apps can open as independent floating windows alongside the current
// host page (Workspace or Photos) without navigating away.
export function getDockNavigationPath(_id: AppId, _pathname: string): string | null {
  return null;
}

/**
 * Compute the URL to display in the address bar for the currently active window
 * without triggering a full Astro navigation (preserving multi-window state).
 */
export function getSyncedUrlForActiveApp(
  activeApp: AppId | null,
  hostPathname: string,
  workspaceUrl: string,
  appUrls?: Partial<Record<AppId, string>>,
): string {
  const hostApp = getDefaultAppForPath(hostPathname);
  const defaultWorkspaceUrl = "/";
  if (activeApp === null) {
    return hostApp === "photos" ? appUrls?.photos || hostPathname : workspaceUrl || defaultWorkspaceUrl;
  }
  if (activeApp === "workspace") {
    return workspaceUrl || defaultWorkspaceUrl;
  }
  if (activeApp === "photos") {
    return appUrls?.photos || (hostApp === "photos" ? hostPathname : getAppRoute("photos"));
  }
  return appUrls?.[activeApp] || getAppRoute(activeApp);
}

export function createInitialWindowState(pathname = "/"): WindowManagerState {
  const initialActive = getDefaultAppForPath(pathname);
  const windows = {} as Record<AppId, WindowInstance>;

  for (const id of ALL_APP_IDS) {
    const isInitial = id === initialActive;
    windows[id] = {
      id,
      isOpen: isInitial,
      isMinimized: false,
      isMaximized: false,
      isPinned: false,
      tile: null,
      zIndex: isInitial ? 10 : 1,
      offsetX: DEFAULT_OFFSETS[id].x,
      offsetY: DEFAULT_OFFSETS[id].y,
    };
  }

  return {
    windows,
    activeApp: initialActive,
    topZ: 10,
    pinLayout: null,
  };
}

export function clampWindowOffset(
  offsetX: number,
  offsetY: number,
  viewportWidth: number,
  viewportHeight: number,
  windowWidth: number,
  windowHeight: number,
): { offsetX: number; offsetY: number } {
  const maxX = Math.max(0, (viewportWidth - windowWidth) / 2 - 16);
  const maxY = Math.max(0, (viewportHeight - windowHeight) / 2 - 16);
  return {
    offsetX: Math.max(-maxX, Math.min(maxX, offsetX)),
    offsetY: Math.max(-maxY, Math.min(maxY, offsetY)),
  };
}

function findNextActiveApp(windows: Record<AppId, WindowInstance>, excludeId?: AppId): AppId | null {
  let best: WindowInstance | null = null;
  for (const id of ALL_APP_IDS) {
    if (id === excludeId) continue;
    const win = windows[id];
    if (win.isOpen && !win.isMinimized) {
      if (!best || win.zIndex > best.zIndex) {
        best = win;
      }
    }
  }
  return best ? best.id : null;
}

function compactWindowZIndices(state: WindowManagerState): WindowManagerState {
  if (state.topZ < 25) return state;
  const ordered = Object.values(state.windows).sort((a, b) => a.zIndex - b.zIndex);
  return {
    ...state,
    topZ: ordered.length,
    windows: Object.fromEntries(ordered.map((win, index) => [
      win.id, { ...win, zIndex: index + 1 },
    ])) as Record<AppId, WindowInstance>,
  };
}

export function getPinBentoIds(hostApp: AppId = "workspace"): AppId[] {
  return hostApp === "photos"
    ? ["photos", "netflix", "spotify", "workspace"]
    : ["workspace", "netflix", "spotify", "photos"];
}

/** Returns the Pin Mode layout when every bento app is still open and pinned. */
export function getActivePinLayout(state: WindowManagerState): AppId[] | null {
  const layout = state.pinLayout;
  if (!Array.isArray(layout) || layout.length === 0) return null;
  const valid = layout.every((id) => state.windows[id]?.isOpen && state.windows[id]?.isPinned);
  return valid ? layout : null;
}

export function windowManagerReducer(
  state: WindowManagerState,
  action: WindowAction,
): WindowManagerState {
  const next = reduceWindowState(state, action);
  // Any action that unpins/closes a bento app ends Pin Mode's custom layout.
  if (next.pinLayout && !getActivePinLayout(next)) {
    return { ...next, pinLayout: null };
  }
  return next;
}

function reduceWindowState(
  state: WindowManagerState,
  action: WindowAction,
): WindowManagerState {
  // Keep app layers below the Dock (60) and switcher. Preserve relative order
  // while reclaiming ranks, rather than letting repeated selections grow forever.
  state = compactWindowZIndices(state);
  switch (action.type) {
    case "RESTORE_STATE": {
      const maxWindowZ = Math.max(
        0,
        ...Object.values(action.state.windows).map((win) => (Number.isFinite(win.zIndex) ? win.zIndex : 0)),
      );
      return compactWindowZIndices({
        ...action.state,
        topZ: Math.max(Number.isFinite(action.state.topZ) ? action.state.topZ : 0, maxWindowZ),
      });
    }

    case "OPEN_APP": {
      const nextZ = state.topZ + 1;
      const current = state.windows[action.id];
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            isOpen: true,
            isMinimized: false,
            isPinned: false,
            zIndex: nextZ,
          },
        },
      };
    }

    case "FOCUS_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      if (state.activeApp === action.id && !current.isMinimized && current.zIndex >= state.topZ) {
        return state;
      }
      const nextZ = state.topZ + 1;
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            isMinimized: false,
            zIndex: nextZ,
          },
        },
      };
    }

    case "CLOSE_APP": {
      const current = state.windows[action.id];
      const defaultOffset = DEFAULT_OFFSETS[action.id];
      const updatedWindows: Record<AppId, WindowInstance> = {
        ...state.windows,
        [action.id]: {
          ...current,
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          tile: null,
          offsetX: defaultOffset.x,
          offsetY: defaultOffset.y,
        },
      };
      return {
        ...state,
        windows: updatedWindows,
        activeApp:
          state.activeApp === action.id
            ? findNextActiveApp(updatedWindows, action.id)
            : state.activeApp,
      };
    }

    case "CLOSE_ALL_APPS": {
      const updatedWindows = {} as Record<AppId, WindowInstance>;
      for (const id of ALL_APP_IDS) {
        const defaultOffset = DEFAULT_OFFSETS[id];
        updatedWindows[id] = {
          ...state.windows[id],
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          tile: null,
          offsetX: defaultOffset.x,
          offsetY: defaultOffset.y,
        };
      }
      return {
        ...state,
        windows: updatedWindows,
        activeApp: null,
      };
    }

    case "MINIMIZE_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      const updatedWindows: Record<AppId, WindowInstance> = {
        ...state.windows,
        [action.id]: {
          ...current,
          isMinimized: true,
        },
      };
      return {
        ...state,
        windows: updatedWindows,
        activeApp:
          state.activeApp === action.id
            ? findNextActiveApp(updatedWindows, action.id)
            : state.activeApp,
      };
    }

    case "TOGGLE_MAXIMIZE_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      const nextZ = state.topZ + 1;
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            isMinimized: false,
            isMaximized: current.tile || current.isPinned ? true : !current.isMaximized,
            isPinned: false,
            tile: null,
            zIndex: nextZ,
          },
        },
      };
    }

    case "SET_MAXIMIZED_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      const nextZ = state.topZ + 1;
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            isMinimized: false,
            isMaximized: action.isMaximized,
            isPinned: false,
            tile: null,
            zIndex: nextZ,
          },
        },
      };
    }

    case "TOGGLE_PIN_APP": {
      const current = state.windows[action.id];
      const nextZ = state.topZ + 1;
      const nextPinned = current.isOpen ? !current.isPinned : true;
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            isOpen: true,
            isMinimized: false,
            isMaximized: nextPinned ? false : current.isMaximized,
            isPinned: nextPinned,
            tile: nextPinned ? null : current.tile,
            zIndex: nextZ,
          },
        },
      };
    }

    case "TOGGLE_PIN_MODE": {
      const primaryApp: AppId = action.hostApp ?? "workspace";
      const bentoIds = getPinBentoIds(primaryApp);
      const alreadyInPinMode = bentoIds.every(
        (id) => state.windows[id].isOpen && state.windows[id].isPinned,
      );
      let nextZ = state.topZ;
      const nextWindows = { ...state.windows };
      if (alreadyInPinMode) {
        // Keep the host plus whichever app was in the centre when leaving Pin Mode.
        const centreApp = getActivePinLayout(state)?.[0] ?? primaryApp;
        for (const id of bentoIds) {
          nextWindows[id] = {
            ...nextWindows[id],
            isPinned: false,
            isOpen: id === primaryApp || id === centreApp,
            isMinimized: false,
          };
        }
        nextZ += 1;
        nextWindows[primaryApp] = { ...nextWindows[primaryApp], zIndex: nextZ };
        if (centreApp !== primaryApp) {
          nextZ += 1;
          nextWindows[centreApp] = { ...nextWindows[centreApp], zIndex: nextZ };
        }
        return {
          ...state,
          topZ: nextZ,
          activeApp: centreApp,
          windows: nextWindows,
          pinLayout: null,
        };
      }
      for (const id of bentoIds) {
        nextZ += 1;
        nextWindows[id] = {
          ...nextWindows[id],
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          isPinned: true,
          tile: null,
          zIndex: nextZ,
        };
      }
      return {
        ...state,
        topZ: nextZ,
        activeApp: primaryApp,
        windows: nextWindows,
        pinLayout: bentoIds,
      };
    }

    case "FOCUS_PIN_APP": {
      const layout = getActivePinLayout(state);
      const slot = layout ? layout.indexOf(action.id) : -1;
      if (!layout || slot < 0) return reduceWindowState(state, { type: "FOCUS_APP", id: action.id });
      const nextLayout = [...layout];
      // Swap the clicked widget with the current centre app so the others stay put.
      [nextLayout[0], nextLayout[slot]] = [nextLayout[slot], nextLayout[0]];
      const nextZ = state.topZ + 1;
      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        pinLayout: nextLayout,
        windows: {
          ...state.windows,
          [action.id]: { ...state.windows[action.id], isMinimized: false, zIndex: nextZ },
        },
      };
    }

    case "TILE_WINDOW": {
      const slots: Record<WindowTilePreset, WindowTileRect[]> = {
        left: [{ x: 0, y: 0, w: 0.5, h: 1 }],
        right: [{ x: 0.5, y: 0, w: 0.5, h: 1 }],
        top: [{ x: 0, y: 0, w: 1, h: 0.5 }],
        bottom: [{ x: 0, y: 0.5, w: 1, h: 0.5 }],
        fill: [{ x: 0, y: 0, w: 1, h: 1 }],
        "left-right": [
          { x: 0, y: 0, w: 0.5, h: 1 },
          { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
        "left-two-right": [
          { x: 0, y: 0, w: 0.5, h: 1 },
          { x: 0.5, y: 0, w: 0.5, h: 0.5 },
          { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
        quarters: [
          { x: 0, y: 0, w: 0.5, h: 0.5 },
          { x: 0.5, y: 0, w: 0.5, h: 0.5 },
          { x: 0, y: 0.5, w: 0.5, h: 0.5 },
          { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
      };

      const targetSlots = slots[action.preset];
      const others = ALL_APP_IDS.filter((id) => {
        if (id === action.id) return false;
        const win = state.windows[id];
        return win.isOpen && !win.isMinimized && !win.isPinned;
      }).sort((a, b) => state.windows[b].zIndex - state.windows[a].zIndex);

      const orderedIds = [action.id, ...others].slice(0, targetSlots.length);
      const updatedWindows: Record<AppId, WindowInstance> = { ...state.windows };
      let nextZ = state.topZ;

      // Assign lower zIndex to secondary tiled windows, highest to action.id
      for (let i = orderedIds.length - 1; i >= 0; i--) {
        const winId = orderedIds[i];
        nextZ += 1;
        updatedWindows[winId] = {
          ...updatedWindows[winId],
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          isPinned: false,
          tile: targetSlots[i],
          zIndex: nextZ,
        };
      }

      return {
        ...state,
        topZ: nextZ,
        activeApp: action.id,
        windows: updatedWindows,
      };
    }

    case "MOVE_WINDOW": {
      const current = state.windows[action.id];
      if (!current.isOpen || current.isMaximized) return state;
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            tile: null,
            offsetX: action.offsetX,
            offsetY: action.offsetY,
          },
        },
      };
    }

    case "SYNC_ROUTE": {
      const routeApp = getDefaultAppForPath(action.pathname);
      const nextZ = state.topZ + 1;
      const current = state.windows[routeApp];
      return {
        ...state,
        topZ: nextZ,
        activeApp: routeApp,
        windows: {
          ...state.windows,
          // Workspace only lives in the Astro host frame; close it when another
          // route takes over so an invisible host cannot steal focus later.
          ...(routeApp !== "workspace"
            ? { workspace: { ...state.windows.workspace, isOpen: false, isMinimized: false } }
            : {}),
          [routeApp]: {
            ...current,
            isOpen: true,
            isMinimized: false,
            zIndex: nextZ,
          },
        },
      };
    }

    default:
      return state;
  }
}
