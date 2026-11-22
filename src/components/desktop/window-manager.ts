import type { AppId } from "../dock/dock.config";

export interface WindowInstance {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  offsetX: number;
  offsetY: number;
}

export interface WindowManagerState {
  windows: Record<AppId, WindowInstance>;
  activeApp: AppId | null;
  topZ: number;
}

export type WindowAction =
  | { type: "OPEN_APP"; id: AppId }
  | { type: "CLOSE_APP"; id: AppId }
  | { type: "MINIMIZE_APP"; id: AppId }
  | { type: "TOGGLE_MAXIMIZE_APP"; id: AppId }
  | { type: "FOCUS_APP"; id: AppId }
  | { type: "MOVE_WINDOW"; id: AppId; offsetX: number; offsetY: number }
  | { type: "SYNC_ROUTE"; pathname: string };

const ALL_APP_IDS: AppId[] = ["netflix", "spotify", "photos", "workspace", "photoshop"];

export function getDefaultAppForPath(pathname: string): AppId {
  return pathname.startsWith("/photos") ? "photos" : "workspace";
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
      zIndex: isInitial ? 10 : 1,
      offsetX: 0,
      offsetY: 0,
    };
  }

  return {
    windows,
    activeApp: initialActive,
    topZ: 10,
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

export function windowManagerReducer(
  state: WindowManagerState,
  action: WindowAction,
): WindowManagerState {
  switch (action.type) {
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
            zIndex: nextZ,
          },
        },
      };
    }

    case "FOCUS_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      if (state.activeApp === action.id && !current.isMinimized) return state;
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
      const updatedWindows: Record<AppId, WindowInstance> = {
        ...state.windows,
        [action.id]: {
          ...current,
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
          offsetX: 0,
          offsetY: 0,
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

    case "MINIMIZE_APP": {
      const current = state.windows[action.id];
      if (!current.isOpen) return state;
      const updatedWindows: Record<AppId, WindowInstance> = {
        ...state.windows,
        [action.id]: {
          ...current,
          isMinimized: true,
          isMaximized: false,
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
            isMaximized: !current.isMaximized,
            zIndex: nextZ,
          },
        },
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
