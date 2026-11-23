import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { navigate } from "astro:transitions/client";
import { Dock } from "../dock/Dock";
import { DEFAULT_DOCK_APPS, type AppId } from "../dock/dock.config";
import { AppSwitcher } from "./AppSwitcher";
import { AppWindow } from "./AppWindow";
import {
  createInitialWindowState,
  getDefaultAppForPath,
  getDockNavigationPath,
  windowManagerReducer,
} from "./window-manager";
import { NetflixApp } from "../apps/NetflixApp";
import { SpotifyApp } from "../apps/SpotifyApp";
import { NikonRecipesApp } from "../apps/NikonRecipesApp";

interface DesktopShellProps {
  initialPath?: string;
}

const APP_TITLES: Record<AppId, string> = {
  netflix: "Netflix — Personal Library",
  spotify: "Spotify — My Music",
  photos: "Photos — Photography",
  workspace: "Phuc Loc Nguyen — Workspace",
  photoshop: "Color Lab — Nikon Imaging Recipes",
};

// Photos is rendered by /photos and /photos/[slug] in the Astro frame.
// Never mount a second gallery over the Workspace after a route change.
const floatingAppIds: AppId[] = ["netflix", "spotify", "photoshop"];

export function DesktopShell({ initialPath = "/" }: DesktopShellProps) {
  const [state, dispatch] = useReducer(
    windowManagerReducer,
    initialPath,
    createInitialWindowState,
  );

  // Sync active app when Astro ViewTransitions changes the route
  useEffect(() => {
    const handlePageLoad = () => {
      dispatch({ type: "SYNC_ROUTE", pathname: window.location.pathname });
    };
    document.addEventListener("astro:page-load", handlePageLoad);
    return () => {
      document.removeEventListener("astro:page-load", handlePageLoad);
    };
  }, []);

  const currentPathname =
    typeof window !== "undefined" ? window.location.pathname : initialPath;
  const hostWindowApp: AppId = getDefaultAppForPath(currentPathname) === "photos" ? "photos" : "workspace";

  // Sync maximized class and z-index on host .mac-window-container so all windows can run simultaneously
  useEffect(() => {
    const anyFloatingMaximized = floatingAppIds.some(
      (id) => state.windows[id].isOpen && !state.windows[id].isMinimized && state.windows[id].isMaximized,
    );
    document.documentElement.classList.toggle("desktop-floating-maximized", anyFloatingMaximized);

    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    if (hostFrame) {
      const hostZ = state.windows[hostWindowApp].zIndex;
      hostFrame.style.position = "relative";
      hostFrame.style.zIndex = String(25 + hostZ);
    }
  }, [hostWindowApp, state.windows]);

  // Clicking directly on the Workspace window brings it to front without closing/minimizing other apps
  useEffect(() => {
    const handleHostPointerDown = () => {
      dispatch({ type: "FOCUS_APP", id: hostWindowApp });
    };
    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    hostFrame?.addEventListener("pointerdown", handleHostPointerDown);
    return () => {
      hostFrame?.removeEventListener("pointerdown", handleHostPointerDown);
    };
    // Astro replaces the frame even when navigating within the same app.
  }, [hostWindowApp, state.windows]);

  // Bring the Astro host window (.mac-window-container) to front when workspace or host photos is focused
  const focusHostWindow = useCallback(() => {
    const restoreBtn = document.querySelector<HTMLButtonElement>('[data-window-action="restore"]');
    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    if (hostFrame?.hidden && restoreBtn) {
      restoreBtn.click();
    } else if (hostFrame?.classList.contains("is-minimized")) {
      const minBtn = document.querySelector<HTMLButtonElement>('[data-window-action="minimize"]');
      minBtn?.click();
    }
  }, []);

  const handleSelectDockApp = useCallback(
    (id: AppId) => {
      const route = getDockNavigationPath(id, window.location.pathname);
      if (!route && (id === "workspace" || id === "photos")) {
        focusHostWindow();
      }

      if (route) {
        // Keep the route in sync with the front-most app. The dataset is preserved
        // by workspace-navigation so the document swap can use its app-switch motion.
        document.documentElement.dataset.appNavigation = "true";
        void navigate(route);
      } else {
        dispatch({ type: "OPEN_APP", id });
      }
    },
    [focusHostWindow],
  );

  const enabledApps = useMemo(
    () => DEFAULT_DOCK_APPS.filter((app) => app.enabled),
    [],
  );

  const runningApps = useMemo<AppId[]>(() => {
    return enabledApps.filter(({ id }) => state.windows[id].isOpen).map(({ id }) => id);
  }, [enabledApps, state.windows]);

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);

  const openSwitcher = useCallback(() => {
    const activeIdx = enabledApps.findIndex((a) => a.id === state.activeApp);
    const nextIdx = activeIdx >= 0 ? (activeIdx + 1) % enabledApps.length : 0;
    setSwitcherIndex(nextIdx);
    setSwitcherOpen(true);
  }, [enabledApps, state.activeApp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && (e.code === "Tab" || e.key === "Tab")) {
        e.preventDefault();
        if (!switcherOpen) {
          const activeIdx = enabledApps.findIndex((a) => a.id === state.activeApp);
          const step = e.shiftKey ? -1 : 1;
          const base = activeIdx >= 0 ? activeIdx : 0;
          setSwitcherIndex((base + step + enabledApps.length) % enabledApps.length);
          setSwitcherOpen(true);
        } else {
          const step = e.shiftKey ? -1 : 1;
          setSwitcherIndex((i) => (i + step + enabledApps.length) % enabledApps.length);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (switcherOpen && (e.key === "Alt" || e.key === "Meta")) {
        const targetApp = enabledApps[switcherIndex];
        setSwitcherOpen(false);
        if (targetApp) {
          handleSelectDockApp(targetApp.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabledApps, handleSelectDockApp, state.activeApp, switcherIndex, switcherOpen]);

  const renderAppContent = (id: AppId) => {
    switch (id) {
      case "netflix":
        return <NetflixApp />;
      case "spotify":
        return <SpotifyApp />;
      case "photoshop":
        return <NikonRecipesApp />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dock
        apps={DEFAULT_DOCK_APPS}
        position="left"
        activeApp={state.activeApp}
        runningApps={runningApps}
        onSelectApp={handleSelectDockApp}
      />

      <button
        type="button"
        className="macos-cmdtab-btn"
        onClick={openSwitcher}
        aria-label="Open App Switcher (Option + Tab)"
        title="Chuyển ứng dụng / trang (bấm hoặc nhấn ⌥ Tab)"
      >
        <kbd>⌘</kbd>
        <kbd>Tab</kbd>
      </button>

      <AppSwitcher
        isOpen={switcherOpen}
        apps={enabledApps}
        selectedIndex={switcherIndex}
        runningApps={runningApps}
        onSelectIndex={setSwitcherIndex}
        onCommit={(id) => {
          setSwitcherOpen(false);
          handleSelectDockApp(id);
        }}
        onClose={() => setSwitcherOpen(false)}
      />

      {floatingAppIds.map((id) => (
        <AppWindow
          key={id}
          windowState={state.windows[id]}
          title={APP_TITLES[id]}
          isActive={state.activeApp === id}
          onFocus={() => dispatch({ type: "FOCUS_APP", id })}
          onClose={() => dispatch({ type: "CLOSE_APP", id })}
          onMinimize={() => dispatch({ type: "MINIMIZE_APP", id })}
          onToggleMaximize={() => dispatch({ type: "TOGGLE_MAXIMIZE_APP", id })}
          onMove={(offsetX, offsetY) =>
            dispatch({ type: "MOVE_WINDOW", id, offsetX, offsetY })
          }
        >
          {renderAppContent(id)}
        </AppWindow>
      ))}
    </>
  );
}

export default DesktopShell;
