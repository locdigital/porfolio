import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { navigate } from "astro:transitions/client";
import { Dock } from "../dock/Dock";
import { DEFAULT_DOCK_APPS, type AppId } from "../dock/dock.config";
import { AppSwitcher } from "./AppSwitcher";
import { AppWindow } from "./AppWindow";
import { DesktopWidget } from "./DesktopWidget";
import { WindowTileMenu } from "./WindowTileMenu";
import {
  createInitialWindowState,
  getDefaultAppForPath,
  getDockNavigationPath,
  getTileGeometryStyle,
  getWindowZIndex,
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

// Photos can open as an independent floating window alongside Workspace.
// On /photos and /photos/[slug], the Astro host frame already renders Photos,
// so we skip mounting a duplicate floating window there.
const floatingAppIds: AppId[] = ["netflix", "spotify", "photos", "photoshop"];

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
    const handleOpenAppEvent = (event: Event) => {
      const id = (event as CustomEvent<{ id?: AppId }>).detail?.id;
      if (!id) return;
      if (id === "workspace" && getDefaultAppForPath(window.location.pathname) !== "workspace") {
        document.documentElement.dataset.appNavigation = "true";
        void navigate("/");
        return;
      }
      dispatch({ type: "OPEN_APP", id });
    };
    document.addEventListener("astro:page-load", handlePageLoad);
    window.addEventListener("desktop:open-app", handleOpenAppEvent);
    return () => {
      document.removeEventListener("astro:page-load", handlePageLoad);
      window.removeEventListener("desktop:open-app", handleOpenAppEvent);
    };
  }, []);

  const currentPathname =
    typeof window !== "undefined" ? window.location.pathname : initialPath;
  const hostWindowApp: AppId = getDefaultAppForPath(currentPathname) === "photos" ? "photos" : "workspace";

  // Sync maximized class and z-index on host .mac-window-container so all windows can run simultaneously
  useEffect(() => {
    const anyFloatingMaximized = floatingAppIds.some(
      (id) =>
        id !== hostWindowApp &&
        state.windows[id].isOpen &&
        !state.windows[id].isMinimized &&
        state.windows[id].isMaximized,
    );
    document.documentElement.classList.toggle("desktop-floating-maximized", anyFloatingMaximized);

    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    if (hostFrame) {
      const hostWin = state.windows[hostWindowApp];
      hostFrame.style.zIndex = String(getWindowZIndex(hostWin));
      hostFrame.classList.toggle("is-pinned", hostWin.isPinned);
      if (hostWin.tile && !hostWin.isMaximized) {
        const geo = getTileGeometryStyle(hostWin.tile);
        hostFrame.classList.add("is-tiled");
        hostFrame.style.position = "fixed";
        hostFrame.style.left = geo.left;
        hostFrame.style.top = geo.top;
        hostFrame.style.width = geo.width;
        hostFrame.style.height = geo.height;
        hostFrame.style.margin = "0";
      } else {
        hostFrame.classList.remove("is-tiled");
        hostFrame.style.position = "relative";
        hostFrame.style.left = "";
        hostFrame.style.top = "";
        hostFrame.style.width = "";
        hostFrame.style.height = "";
        hostFrame.style.margin = "";
      }
    }
  }, [hostWindowApp, state.windows]);

  const [hostContextMenu, setHostContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [hostTileMenu, setHostTileMenu] = useState<{ x: number; y: number } | null>(null);
  const hostTileOpenTimer = useRef<number | null>(null);
  const hostTileCloseTimer = useRef<number | null>(null);

  const clearHostTileTimers = useCallback(() => {
    if (hostTileOpenTimer.current !== null) {
      window.clearTimeout(hostTileOpenTimer.current);
      hostTileOpenTimer.current = null;
    }
    if (hostTileCloseTimer.current !== null) {
      window.clearTimeout(hostTileCloseTimer.current);
      hostTileCloseTimer.current = null;
    }
  }, []);

  const scheduleHostTileClose = useCallback(() => {
    clearHostTileTimers();
    hostTileCloseTimer.current = window.setTimeout(() => {
      setHostTileMenu(null);
    }, 180);
  }, [clearHostTileTimers]);

  useEffect(() => {
    const hostMaxBtn = document.querySelector<HTMLButtonElement>(".mac-window-container .mac-dot-maximize");
    if (!hostMaxBtn) return;

    const onEnter = () => {
      if (window.innerWidth < 1024) return;
      clearHostTileTimers();
      const rect = hostMaxBtn.getBoundingClientRect();
      hostTileOpenTimer.current = window.setTimeout(() => {
        const menuW = 248;
        const x = Math.max(8, Math.min(rect.left - 18, window.innerWidth - menuW - 8));
        const y = Math.min(rect.bottom + 10, window.innerHeight - 190);
        setHostTileMenu({ x, y });
      }, 220);
    };
    const onLeave = () => scheduleHostTileClose();
    const onClick = () => {
      clearHostTileTimers();
      setHostTileMenu(null);
      if (state.windows[hostWindowApp].tile) {
        dispatch({ type: "MOVE_WINDOW", id: hostWindowApp, offsetX: 0, offsetY: 0 });
      }
    };

    hostMaxBtn.addEventListener("mouseenter", onEnter);
    hostMaxBtn.addEventListener("mouseleave", onLeave);
    hostMaxBtn.addEventListener("click", onClick);
    return () => {
      clearHostTileTimers();
      hostMaxBtn.removeEventListener("mouseenter", onEnter);
      hostMaxBtn.removeEventListener("mouseleave", onLeave);
      hostMaxBtn.removeEventListener("click", onClick);
    };
  }, [clearHostTileTimers, hostWindowApp, scheduleHostTileClose, state.windows]);

  useEffect(() => {
    const hostTitlebar = document.querySelector<HTMLElement>(".mac-window-container .desktop-titlebar");
    if (!hostTitlebar) return;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      dispatch({ type: "FOCUS_APP", id: hostWindowApp });
      const x = Math.max(8, Math.min(e.clientX, window.innerWidth - 198));
      const y = Math.max(8, Math.min(e.clientY, window.innerHeight - 52));
      setHostContextMenu({ x, y });
    };
    hostTitlebar.addEventListener("contextmenu", handleContextMenu);
    return () => {
      hostTitlebar.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [hostWindowApp, state.windows]);

  useEffect(() => {
    if (!hostContextMenu) return;
    const close = () => setHostContextMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
    };
  }, [hostContextMenu]);

  // Clicking directly on the Workspace window brings it to front without closing/minimizing other apps
  useEffect(() => {
    const handleHostPointerDown = () => {
      dispatch({ type: "FOCUS_APP", id: hostWindowApp });
    };
    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    const titlebar = hostFrame?.querySelector<HTMLElement>(".desktop-titlebar");
    const handleTitlebarClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
      handleHostPointerDown();
    };
    hostFrame?.addEventListener("pointerdown", handleHostPointerDown);
    hostFrame?.addEventListener("focusin", handleHostPointerDown);
    titlebar?.addEventListener("click", handleTitlebarClick);
    return () => {
      hostFrame?.removeEventListener("pointerdown", handleHostPointerDown);
      hostFrame?.removeEventListener("focusin", handleHostPointerDown);
      titlebar?.removeEventListener("click", handleTitlebarClick);
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
      if (!route && id === hostWindowApp) {
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
    [focusHostWindow, hostWindowApp],
  );

  const enabledApps = useMemo(
    () => DEFAULT_DOCK_APPS.filter((app) => app.enabled),
    [],
  );

  const runningApps = useMemo<AppId[]>(() => {
    return enabledApps.filter(({ id }) => state.windows[id].isOpen).map(({ id }) => id);
  }, [enabledApps, state.windows]);

  const pinnedApps = useMemo<AppId[]>(() => {
    return enabledApps.filter(({ id }) => state.windows[id].isPinned).map(({ id }) => id);
  }, [enabledApps, state.windows]);

  const isPinMode = useMemo(() => {
    const bentoIds: AppId[] = ["workspace", "netflix", "spotify", "photos"];
    return bentoIds.every((id) => state.windows[id].isOpen && state.windows[id].isPinned);
  }, [state.windows]);

  const handleTogglePinMode = useCallback(() => {
    focusHostWindow();
    dispatch({ type: "TOGGLE_PIN_MODE" });
  }, [focusHostWindow]);

  const handlePinDockApp = useCallback(
    (id: AppId) => {
      if (id === hostWindowApp) {
        focusHostWindow();
      }
      dispatch({ type: "TOGGLE_PIN_APP", id });
    },
    [focusHostWindow, hostWindowApp],
  );

  const handleQuitDockApp = useCallback(
    (id: AppId) => {
      if (id === hostWindowApp) {
        const closeBtn = document.querySelector<HTMLButtonElement>('[data-window-action="close"]');
        closeBtn?.click();
      }
      dispatch({ type: "CLOSE_APP", id });
    },
    [hostWindowApp],
  );

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab" || e.key === "Tab") {
        if (e.ctrlKey) return;
        const target = e.target as HTMLElement | null;
        if (
          !switcherOpen &&
          target &&
          (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') !== null)
        ) {
          return;
        }
        e.preventDefault();
        const step = e.shiftKey ? -1 : 1;
        if (!switcherOpen) {
          const activeIdx = enabledApps.findIndex((a) => a.id === state.activeApp);
          const base = activeIdx >= 0 ? activeIdx : 0;
          setSwitcherIndex((base + step + enabledApps.length) % enabledApps.length);
          setSwitcherOpen(true);
        } else {
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
        pinnedApps={pinnedApps}
        isPinMode={isPinMode}
        onSelectApp={handleSelectDockApp}
        onPinApp={handlePinDockApp}
        onTogglePinMode={handleTogglePinMode}
        onQuitApp={handleQuitDockApp}
      />

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

      {floatingAppIds.map((id, idx) => {
        if (id === hostWindowApp) return null;
        const win = state.windows[id];
        if (win.isOpen && !win.isMinimized && win.isPinned) {
          return (
            <DesktopWidget
              key={`${id}-widget`}
              id={id}
              title={APP_TITLES[id]}
              zIndex={getWindowZIndex(win)}
              index={idx}
              onFocus={() => dispatch({ type: "FOCUS_APP", id })}
              onUnpin={() => dispatch({ type: "TOGGLE_PIN_APP", id })}
              onClose={() => dispatch({ type: "CLOSE_APP", id })}
            />
          );
        }
        return (
          <AppWindow
            key={id}
            windowState={win}
            title={APP_TITLES[id]}
            isActive={state.activeApp === id}
            onFocus={() => dispatch({ type: "FOCUS_APP", id })}
            onClose={() => dispatch({ type: "CLOSE_APP", id })}
            onMinimize={() => dispatch({ type: "MINIMIZE_APP", id })}
            onToggleMaximize={() => dispatch({ type: "TOGGLE_MAXIMIZE_APP", id })}
            onTogglePin={() => dispatch({ type: "TOGGLE_PIN_APP", id })}
            onTile={(preset) => dispatch({ type: "TILE_WINDOW", id, preset })}
            onMove={(offsetX, offsetY) =>
              dispatch({ type: "MOVE_WINDOW", id, offsetX, offsetY })
            }
          >
            {renderAppContent(id)}
          </AppWindow>
        );
      })}

      {hostTileMenu && (
        <WindowTileMenu
          x={hostTileMenu.x}
          y={hostTileMenu.y}
          onMouseEnter={clearHostTileTimers}
          onMouseLeave={scheduleHostTileClose}
          onSelect={(preset) => {
            clearHostTileTimers();
            setHostTileMenu(null);
            dispatch({ type: "TILE_WINDOW", id: hostWindowApp, preset });
          }}
        />
      )}

      {hostContextMenu && (
        <div
          role="menu"
          className="desktop-context-menu"
          style={{ left: hostContextMenu.x, top: hostContextMenu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={state.windows[hostWindowApp].isPinned}
            className={`desktop-context-menu__item${state.windows[hostWindowApp].isPinned ? " is-checked" : ""}`}
            onClick={() => {
              dispatch({ type: "TOGGLE_PIN_APP", id: hostWindowApp });
              setHostContextMenu(null);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
            <span>{state.windows[hostWindowApp].isPinned ? "Unpin widget" : "Pin as widget"}</span>
          </button>
        </div>
      )}
    </>
  );
}

export default DesktopShell;
