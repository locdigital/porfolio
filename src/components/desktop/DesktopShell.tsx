import { useCallback, useEffect, useMemo, useReducer } from "react";
import { Dock } from "../dock/Dock";
import { DEFAULT_DOCK_APPS, type AppId } from "../dock/dock.config";
import { AppWindow } from "./AppWindow";
import {
  createInitialWindowState,
  getDefaultAppForPath,
  windowManagerReducer,
} from "./window-manager";
import { NetflixApp } from "../apps/NetflixApp";
import { SpotifyApp } from "../apps/SpotifyApp";
import { PhotosApp } from "../apps/PhotosApp";
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
    window.addEventListener("popstate", handlePageLoad);
    return () => {
      document.removeEventListener("astro:page-load", handlePageLoad);
      window.removeEventListener("popstate", handlePageLoad);
    };
  }, []);

  const currentPathname =
    typeof window !== "undefined" ? window.location.pathname : initialPath;
  const hostWindowApp: AppId = getDefaultAppForPath(currentPathname);

  // Determine which apps are rendered as floating React AppWindows
  const floatingAppIds: AppId[] = useMemo(() => {
    const ids: AppId[] = ["netflix", "spotify", "photoshop"];
    if (hostWindowApp !== "photos") {
      ids.push("photos");
    }
    return ids;
  }, [hostWindowApp]);

  // Sync maximized class on <html> when any floating window is maximized
  useEffect(() => {
    const anyFloatingMaximized = floatingAppIds.some(
      (id) => state.windows[id].isOpen && !state.windows[id].isMinimized && state.windows[id].isMaximized,
    );
    document.documentElement.classList.toggle("desktop-floating-maximized", anyFloatingMaximized);
  }, [floatingAppIds, state.windows]);

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
      if (id === "workspace") {
        // Minimize floating overlays so Workspace is clearly frontmost
        for (const fid of floatingAppIds) {
          if (state.windows[fid].isOpen && !state.windows[fid].isMinimized) {
            dispatch({ type: "MINIMIZE_APP", id: fid });
          }
        }
        focusHostWindow();
        dispatch({ type: "OPEN_APP", id: "workspace" });
        return;
      }

      if (id === "photos" && hostWindowApp === "photos") {
        // Already on /photos route: bring host Photography window to front
        for (const fid of floatingAppIds) {
          if (state.windows[fid].isOpen && !state.windows[fid].isMinimized) {
            dispatch({ type: "MINIMIZE_APP", id: fid });
          }
        }
        focusHostWindow();
        dispatch({ type: "OPEN_APP", id: "photos" });
        return;
      }

      dispatch({ type: "OPEN_APP", id });
    },
    [floatingAppIds, focusHostWindow, hostWindowApp, state.windows],
  );

  const runningApps = useMemo<AppId[]>(() => {
    const running: AppId[] = [hostWindowApp];
    for (const id of floatingAppIds) {
      if (state.windows[id].isOpen) running.push(id);
    }
    return Array.from(new Set(running));
  }, [floatingAppIds, hostWindowApp, state.windows]);

  const renderAppContent = (id: AppId) => {
    switch (id) {
      case "netflix":
        return <NetflixApp />;
      case "spotify":
        return <SpotifyApp />;
      case "photos":
        return <PhotosApp />;
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
