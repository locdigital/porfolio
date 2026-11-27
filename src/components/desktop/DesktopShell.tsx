import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ComponentType } from "react";
import { navigate, type TransitionBeforePreparationEvent } from "astro:transitions/client";
import { Dock } from "../dock/Dock";
import { DEFAULT_DOCK_APPS, type AppId } from "../dock/dock.config";
import { AppSwitcher } from "./AppSwitcher";
import { AppWindow } from "./AppWindow";
import { EmbeddedRouteApp } from "./EmbeddedRouteApp";
import { WindowTileMenu } from "./WindowTileMenu";
import {
  createInitialWindowState,
  getActivePinLayout,
  getDefaultAppForPath,
  getPinBentoIds,
  getDockNavigationPath,
  getSyncedUrlForActiveApp,
  getTileGeometryStyle,
  getWindowZIndex,
  windowManagerReducer,
} from "./window-manager";
import { readHostWindowState } from "../../lib/host-window-state";
import { getUiCopy } from "../../i18n/ui";

const DesktopWidget = lazy(() => import("./DesktopWidget").then((module) => ({ default: module.DesktopWidget })));

export interface FloatingAppProps {
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
}

function preloadableApp<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let ready: ComponentType<P> | undefined;
  const preload = async () => {
    const module = await load();
    ready = module.default;
    return module;
  };
  const LazyApp = lazy(preload);

  function App(props: P) {
    // Keep the mounted component type stable if it originally loaded via Suspense.
    const [Content] = useState(() => ready ?? LazyApp);
    return <Content {...props} />;
  }
  return { App, preload };
}

const { App: NetflixApp, preload: loadNetflix } = preloadableApp<FloatingAppProps>(
  () => import("../apps/NetflixApp").then((module) => ({ default: module.NetflixApp })),
);
const { App: SpotifyApp, preload: loadSpotify } = preloadableApp<FloatingAppProps>(
  () => import("../apps/SpotifyApp").then((module) => ({ default: module.SpotifyApp })),
);

const NikonRecipesApp = lazy(() => import("../apps/NikonRecipesApp").then((module) => ({ default: module.NikonRecipesApp })));

interface DesktopShellProps {
  initialPath?: string;
}

// Any app other than the current host page can open as a floating window
// (and pin as a desktop widget) alongside the host window.
const floatingAppIds: AppId[] = ["netflix", "spotify", "photos", "workspace", "photoshop"];

const WINDOW_STATE_STORAGE_KEY = "desktop-window-manager-state-v1";

export function DesktopShell(props: DesktopShellProps) {
  const isEmbedded =
    typeof window !== "undefined" &&
    (window.self !== window.top ||
      new URLSearchParams(window.location.search).get("embed") === "1");
  if (isEmbedded) return null;
  return <DesktopShellInner {...props} />;
}

function DesktopShellInner({ initialPath = "/" }: DesktopShellProps) {
  const desktopCopy = useMemo(() => getUiCopy().desktop, []);
  const appTitles = desktopCopy.appTitles;

  const [state, dispatch] = useReducer(
    windowManagerReducer,
    initialPath,
    createInitialWindowState,
  );
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const hasHydratedStorageRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCompactViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Restore open windows / active app / pin mode across F5 reloads
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WINDOW_STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.windows &&
          typeof parsed.windows === "object" &&
          parsed.windows.workspace &&
          parsed.windows.netflix &&
          parsed.windows.spotify &&
          parsed.windows.photos &&
          parsed.windows.photoshop
        ) {
          dispatch({ type: "RESTORE_STATE", state: parsed });
          const urlApp = getDefaultAppForPath(window.location.pathname);
          // Pin Mode may have a non-host app in the centre; don't unpin it on reload.
          const restoredPinMode = Array.isArray(parsed.pinLayout) && parsed.windows[urlApp]?.isPinned;
          if (!parsed.windows[urlApp]?.isOpen || (parsed.activeApp !== urlApp && !restoredPinMode)) {
            dispatch({ type: "OPEN_APP", id: urlApp });
          }
        }
      }
      const currentHostApp: AppId =
        getDefaultAppForPath(window.location.pathname) === "photos" ? "photos" : "workspace";
      const hostSaved = readHostWindowState(sessionStorage, currentHostApp);
      if (hostSaved.closed) {
        dispatch({ type: "CLOSE_APP", id: currentHostApp });
      } else if (hostSaved.minimized) {
        dispatch({ type: "MINIMIZE_APP", id: currentHostApp });
      } else if (hostSaved.maximized) {
        dispatch({ type: "SET_MAXIMIZED_APP", id: currentHostApp, isMaximized: true });
      }
    } catch {}
    hasHydratedStorageRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedStorageRef.current) return;
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      try {
        sessionStorage.setItem(WINDOW_STATE_STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }, 120);
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [state]);

  // Sync active app when Astro ViewTransitions changes the route
  const [routeSwapTick, setRouteSwapTick] = useState(0);
  const [hostPathname, setHostPathname] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname : initialPath,
  );
  const initialBrowserUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : initialPath;
  const initialRouteApp = getDefaultAppForPath(
    typeof window !== "undefined" ? window.location.pathname : initialPath,
  );
  const appUrlsRef = useRef<Partial<Record<AppId, string>>>({
    [initialRouteApp]: initialBrowserUrl,
  });
  const workspaceUrlRef = useRef<string>(
    typeof window !== "undefined" && getDefaultAppForPath(window.location.pathname) === "workspace"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : getDefaultAppForPath(initialPath) === "workspace"
        ? initialPath
        : "/",
  );
  const hostPathnameRef = useRef(hostPathname);
  hostPathnameRef.current = hostPathname;

  const handleAppUrlChange = useCallback((id: AppId, nextUrl: string) => {
    if (!nextUrl) return;
    appUrlsRef.current[id] = nextUrl;
    if (typeof window === "undefined") return;
    if (stateRef.current.activeApp === id) {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) {
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    }
  }, []);

  useEffect(() => {
    const handlePageLoad = () => {
      const nextPathname = window.location.pathname;
      const nextFullUrl = `${nextPathname}${window.location.search}${window.location.hash}`;
      const routeApp = getDefaultAppForPath(nextPathname);
      setHostPathname(nextPathname);
      hostPathnameRef.current = nextPathname;
      appUrlsRef.current[routeApp] = nextFullUrl;
      if (routeApp === "workspace") {
        workspaceUrlRef.current = nextFullUrl;
      }
      dispatch({ type: "SYNC_ROUTE", pathname: nextPathname });
      setRouteSwapTick((tick) => tick + 1);
    };
    const handlePhotosUrlEvent = (event: Event) => {
      const nextUrl = (event as CustomEvent<{ url?: string }>).detail?.url;
      if (typeof nextUrl === "string" && nextUrl.startsWith("/photos")) {
        appUrlsRef.current.photos = nextUrl;
      }
    };
    const handleHashChange = () => {
      const currentFullUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const currentApp = getDefaultAppForPath(window.location.pathname);
      appUrlsRef.current[currentApp] = currentFullUrl;
      if (currentApp === "workspace") {
        workspaceUrlRef.current = currentFullUrl;
      }
    };
    const prepareFloatingRoute = (event: Event) => {
      const navigation = event as TransitionBeforePreparationEvent;
      const app = getDefaultAppForPath(navigation.to.pathname);
      if (app !== "netflix" && app !== "spotify") return;
      const load = navigation.loader;
      // Have the incoming window ready for its first frame. Fetch its module
      // alongside the route HTML while the current Workspace remains visible.
      navigation.loader = async () => {
        const loadApp = app === "netflix" ? loadNetflix : loadSpotify;
        await Promise.all([load(), loadApp().catch(() => undefined)]);
      };
    };
    const handleOpenAppEvent = (event: Event) => {
      const id = (event as CustomEvent<{ id?: AppId }>).detail?.id;
      if (!id) return;
      handleSelectDockAppRef.current(id);
    };
    const handleEmbedMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; id?: AppId; url?: string } | null;
      if (data?.type === "desktop:open-app" && data.id) {
        if (typeof data.url === "string" && data.url.startsWith("/")) {
          appUrlsRef.current[data.id] = data.url;
        }
        handleSelectDockAppRef.current(data.id);
      }
    };
    document.addEventListener("astro:before-preparation", prepareFloatingRoute);
    document.addEventListener("astro:after-swap", handlePageLoad);
    window.addEventListener("desktop:open-app", handleOpenAppEvent);
    window.addEventListener("message", handleEmbedMessage);
    window.addEventListener("photos:url-change", handlePhotosUrlEvent);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      document.removeEventListener("astro:before-preparation", prepareFloatingRoute);
      document.removeEventListener("astro:after-swap", handlePageLoad);
      window.removeEventListener("desktop:open-app", handleOpenAppEvent);
      window.removeEventListener("message", handleEmbedMessage);
      window.removeEventListener("photos:url-change", handlePhotosUrlEvent);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Keep the browser URL bar in sync with the active floating/host window without navigating away.
  useEffect(() => {
    if (!hasHydratedStorageRef.current || typeof window === "undefined") return;
    const targetUrl = getSyncedUrlForActiveApp(
      state.activeApp,
      hostPathname,
      workspaceUrlRef.current,
      appUrlsRef.current,
    );
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (targetUrl && targetUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", targetUrl);
    }
  }, [state.activeApp, hostPathname]);

  const hostWindowApp: AppId = getDefaultAppForPath(hostPathname) === "photos" ? "photos" : "workspace";

  // Pin Mode: every bento app open + pinned. pinLayout[0] is the large centre
  // window; the rest fill the widget column in order.
  const isPinMode = getPinBentoIds(hostWindowApp).every(
    (id) => state.windows[id].isOpen && state.windows[id].isPinned,
  );
  const pinLayout: AppId[] | null = isPinMode
    ? getActivePinLayout(state) ?? getPinBentoIds(hostWindowApp)
    : null;
  const pinCenter: AppId | null = !isCompactViewport && pinLayout ? pinLayout[0] : null;
  const isHostPinDocked = pinCenter !== null && pinCenter !== hostWindowApp;

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

  // Sync maximized class and z-index on host .mac-window-container synchronously before paint
  useIsomorphicLayoutEffect(() => {
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
      const isHostTiledOrPinned =
        !isCompactViewport && (hostWin.isPinned || (Boolean(hostWin.tile) && !hostWin.isMaximized));
      if (
        isHostTiledOrPinned &&
        (hostFrame.classList.contains("is-maximized") ||
          document.documentElement.classList.contains("window-maximized"))
      ) {
        hostFrame.classList.remove("is-maximized");
        document.documentElement.classList.remove("window-maximized");
        window.dispatchEvent(new CustomEvent("desktop:unmaximize-host"));
      }
      hostFrame.classList.toggle("is-pinned", !isCompactViewport && hostWin.isPinned);
      // Another app took the Pin Mode centre: hide the host page, its widget stands in.
      hostFrame.classList.toggle("is-pin-docked", isHostPinDocked);
      hostFrame.toggleAttribute("inert", isHostPinDocked);
      if (!isCompactViewport && hostWin.tile && !hostWin.isMaximized) {
        const geo = getTileGeometryStyle(hostWin.tile);
        hostFrame.classList.add("is-tiled");
        hostFrame.style.position = "fixed";
        hostFrame.style.left = geo.left;
        hostFrame.style.top = geo.top;
        hostFrame.style.right = "auto";
        hostFrame.style.bottom = "auto";
        hostFrame.style.width = geo.width;
        hostFrame.style.height = geo.height;
        hostFrame.style.margin = "0";
      } else {
        hostFrame.classList.remove("is-tiled");
        hostFrame.style.position = "";
        hostFrame.style.left = "";
        hostFrame.style.top = "";
        hostFrame.style.right = "";
        hostFrame.style.bottom = "";
        hostFrame.style.width = "";
        hostFrame.style.height = "";
        hostFrame.style.margin = "";
      }
    }
  }, [hostWindowApp, isCompactViewport, isHostPinDocked, routeSwapTick, state.windows]);

  useEffect(() => {
    const handleClearHostLayout = () => {
      const hostWin = state.windows[hostWindowApp];
      if (hostWin.isPinned) {
        dispatch({ type: "TOGGLE_PIN_APP", id: hostWindowApp });
      }
      if (hostWin.tile) {
        dispatch({
          type: "MOVE_WINDOW",
          id: hostWindowApp,
          offsetX: hostWin.offsetX,
          offsetY: hostWin.offsetY,
        });
      }
    };
    window.addEventListener("desktop:clear-host-layout", handleClearHostLayout);
    return () => {
      window.removeEventListener("desktop:clear-host-layout", handleClearHostLayout);
    };
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
  }, [clearHostTileTimers, hostWindowApp, routeSwapTick, scheduleHostTileClose]);

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
  }, [hostWindowApp, routeSwapTick]);

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

  // Keep refs to current hostWindowApp and state so the capture listener never churns on re-renders.
  const hostWindowAppRef = useRef<AppId>(hostWindowApp);
  hostWindowAppRef.current = hostWindowApp;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Clicking directly on the Workspace window brings it to front without closing/minimizing other apps.
  // Use document-level capture so it survives astro:after-swap DOM replacement and child stopPropagation.
  useEffect(() => {
    const focusHost = () => {
      const appId = hostWindowAppRef.current;
      const currentState = stateRef.current;
      const hostWin = currentState.windows[appId];
      // If user landed directly on an empty floating-app fallback route (e.g. /entertainment/netflix)
      // and clicks the visible Workspace host frame, restore Workspace home content too.
      if (appId === "workspace" && document.querySelector(".mac-window-container .app-route-fallback")) {
        void navigate("/");
      }
      if (!hostWin.isOpen || hostWin.isMinimized) {
        dispatch({ type: "OPEN_APP", id: appId });
      } else if (currentState.activeApp !== appId || hostWin.zIndex < currentState.topZ) {
        dispatch({ type: "FOCUS_APP", id: appId });
      }
    };
    const handleHostInteract = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest(".mac-traffic-lights")) return;
      if (target.closest(".mac-window-container")) {
        focusHost();
      }
    };
    const handleHostWindowAction = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          action?: "close" | "minimize" | "restore" | "maximize";
          app?: AppId;
          maximized?: boolean;
        }>
      ).detail;
      const appId = detail?.app ?? hostWindowAppRef.current;
      if (detail?.action === "close") {
        dispatch({ type: "CLOSE_APP", id: appId });
      } else if (detail?.action === "minimize") {
        dispatch({ type: "MINIMIZE_APP", id: appId });
      } else if (detail?.action === "restore") {
        dispatch({ type: "OPEN_APP", id: appId });
      } else if (detail?.action === "maximize") {
        dispatch({
          type: "SET_MAXIMIZED_APP",
          id: appId,
          isMaximized: Boolean(detail.maximized),
        });
      }
    };
    document.addEventListener("pointerdown", handleHostInteract, true);
    document.addEventListener("focusin", handleHostInteract, true);
    window.addEventListener("desktop:host-window-action", handleHostWindowAction);
    return () => {
      document.removeEventListener("pointerdown", handleHostInteract, true);
      document.removeEventListener("focusin", handleHostInteract, true);
      window.removeEventListener("desktop:host-window-action", handleHostWindowAction);
    };
  }, []);

  // Bring the Astro host window (.mac-window-container) to front when workspace or host photos is focused
  const focusHostWindow = useCallback(() => {
    const hostFrame = document.querySelector<HTMLElement>(".mac-window-container");
    if (hostFrame?.hidden || hostFrame?.classList.contains("is-minimized")) {
      window.dispatchEvent(
        new CustomEvent("desktop:host-command", { detail: { action: "restore" } }),
      );
    }
  }, []);

  const handleSelectDockApp = useCallback(
    (id: AppId) => {
      if (id === hostWindowApp) {
        focusHostWindow();
      }

      const activeLayout = getActivePinLayout(stateRef.current);
      if (activeLayout?.includes(id) && window.innerWidth >= 1024) {
        dispatch({ type: "FOCUS_PIN_APP", id });
        return;
      }

      const route = getDockNavigationPath(id, hostPathnameRef.current);
      if (route) {
        void navigate(route);
      } else {
        dispatch({ type: "OPEN_APP", id });
      }
    },
    [focusHostWindow, hostWindowApp],
  );
  const handleSelectDockAppRef = useRef(handleSelectDockApp);
  handleSelectDockAppRef.current = handleSelectDockApp;

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

  const handleTogglePinMode = useCallback(() => {
    focusHostWindow();
    dispatch({ type: "TOGGLE_PIN_MODE", hostApp: hostWindowApp });
  }, [focusHostWindow, hostWindowApp]);

  const handlePinDockApp = useCallback(
    (id: AppId) => {
      if (id === hostWindowApp) {
        focusHostWindow();
      }
      dispatch({ type: "TOGGLE_PIN_APP", id });
    },
    [focusHostWindow, hostWindowApp],
  );

  const closeFloatingOrRouteApp = useCallback(
    (id: AppId) => {
      if (id === "spotify") {
        void import("../apps/spotify/spotify-audio").then(({ sharedSpotifyAudio }) => {
          sharedSpotifyAudio.stop();
        });
      }
      if (id !== "workspace") {
        delete appUrlsRef.current[id];
      }
      if (id === hostWindowApp) {
        window.dispatchEvent(
          new CustomEvent("desktop:host-command", { detail: { action: "close" } }),
        );
      }
      dispatch({ type: "CLOSE_APP", id });
      // If closing the app that owns a dedicated empty fallback route (e.g. /entertainment/netflix or /music/spotify),
      // navigate cleanly back to Workspace home so mobile/desktop users aren't left on an empty shell.
      if (
        typeof window !== "undefined" &&
        getDefaultAppForPath(hostPathnameRef.current) === id &&
        id !== "workspace" &&
        id !== "photos"
      ) {
        void navigate("/");
      }
    },
    [hostWindowApp],
  );

  const handleQuitDockApp = useCallback(
    (id: AppId) => {
      closeFloatingOrRouteApp(id);
    },
    [closeFloatingOrRouteApp],
  );

  const handleCloseAllApps = useCallback(() => {
    void import("../apps/spotify/spotify-audio").then(({ sharedSpotifyAudio }) => {
      sharedSpotifyAudio.stop();
    });
    delete appUrlsRef.current.netflix;
    delete appUrlsRef.current.spotify;
    delete appUrlsRef.current.photos;
    delete appUrlsRef.current.photoshop;
    window.dispatchEvent(
      new CustomEvent("desktop:host-command", { detail: { action: "close" } }),
    );
    dispatch({ type: "CLOSE_ALL_APPS" });
  }, []);

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const switcherCommitTimerRef = useRef<number | null>(null);

  const clearSwitcherCommitTimer = useCallback(() => {
    if (switcherCommitTimerRef.current !== null) {
      window.clearTimeout(switcherCommitTimerRef.current);
      switcherCommitTimerRef.current = null;
    }
  }, []);

  const commitSwitcherSelection = useCallback(
    (index: number) => {
      clearSwitcherCommitTimer();
      const targetApp = enabledApps[index];
      setSwitcherOpen(false);
      if (targetApp) {
        handleSelectDockApp(targetApp.id);
      }
    },
    [clearSwitcherCommitTimer, enabledApps, handleSelectDockApp],
  );

  useEffect(() => {
    const scheduleCommit = (nextIndex: number) => {
      clearSwitcherCommitTimer();
      switcherCommitTimerRef.current = window.setTimeout(() => {
        commitSwitcherSelection(nextIndex);
      }, 850);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab" || e.key === "Tab") {
        if (e.defaultPrevented || e.ctrlKey) return;
        const target = e.target instanceof Element ? e.target : null;
        if (
          !switcherOpen &&
          (target?.closest('[role="dialog"][aria-modal="true"]') ||
            target?.closest("input, textarea, select, [contenteditable='true']"))
        ) {
          return;
        }
        e.preventDefault();
        const step = e.shiftKey ? -1 : 1;
        let nextIndex: number;
        if (!switcherOpen) {
          const activeIdx = enabledApps.findIndex((a) => a.id === state.activeApp);
          const base = activeIdx >= 0 ? activeIdx : 0;
          nextIndex = (base + step + enabledApps.length) % enabledApps.length;
          setSwitcherIndex(nextIndex);
          setSwitcherOpen(true);
        } else {
          nextIndex = (switcherIndex + step + enabledApps.length) % enabledApps.length;
          setSwitcherIndex(nextIndex);
        }
        if (!e.altKey && !e.metaKey) {
          scheduleCommit(nextIndex);
        }
        return;
      }

      if (!switcherOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        clearSwitcherCommitTimer();
        setSwitcherOpen(false);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        commitSwitcherSelection(switcherIndex);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (switcherIndex + step + enabledApps.length) % enabledApps.length;
        setSwitcherIndex(nextIndex);
        scheduleCommit(nextIndex);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (switcherOpen && (e.key === "Alt" || e.key === "Meta")) {
        commitSwitcherSelection(switcherIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    clearSwitcherCommitTimer,
    commitSwitcherSelection,
    enabledApps,
    state.activeApp,
    switcherIndex,
    switcherOpen,
  ]);

  useEffect(() => () => clearSwitcherCommitTimer(), [clearSwitcherCommitTimer]);

  const renderAppContent = (id: AppId) => {
    const props: FloatingAppProps = {
      initialUrl: appUrlsRef.current[id],
      onUrlChange: (url) => handleAppUrlChange(id, url),
    };
    switch (id) {
      case "netflix":
        return <NetflixApp {...props} />;
      case "spotify":
        return <SpotifyApp {...props} />;
      case "photos":
        return (
          <EmbeddedRouteApp
            appId="photos"
            defaultRoute="/photos"
            title={appTitles.photos}
            initialUrl={props.initialUrl}
            onUrlChange={props.onUrlChange}
            onFocus={windowHandlers.photos.onFocus}
          />
        );
      case "workspace":
        return (
          <EmbeddedRouteApp
            appId="workspace"
            defaultRoute="/"
            title={appTitles.workspace}
            initialUrl={props.initialUrl || workspaceUrlRef.current}
            onUrlChange={props.onUrlChange}
            onFocus={windowHandlers.workspace.onFocus}
          />
        );
      case "photoshop":
        return <NikonRecipesApp {...props} />;
      default:
        return null;
    }
  };

  const windowHandlers = useMemo(() => {
    const map = {} as Record<
      AppId,
      {
        onFocus: () => void;
        onClose: () => void;
        onMinimize: () => void;
        onToggleMaximize: () => void;
        onTogglePin: () => void;
        onTile: (preset: import("./window-manager").WindowTilePreset) => void;
        onMove: (offsetX: number, offsetY: number) => void;
      }
    >;
    for (const id of floatingAppIds) {
      map[id] = {
        onFocus: () => dispatch({ type: "FOCUS_APP", id }),
        onClose: () => closeFloatingOrRouteApp(id),
        onMinimize: () => dispatch({ type: "MINIMIZE_APP", id }),
        onToggleMaximize: () => dispatch({ type: "TOGGLE_MAXIMIZE_APP", id }),
        onTogglePin: () => dispatch({ type: "TOGGLE_PIN_APP", id }),
        onTile: (preset) => dispatch({ type: "TILE_WINDOW", id, preset }),
        onMove: (offsetX, offsetY) => dispatch({ type: "MOVE_WINDOW", id, offsetX, offsetY }),
      };
    }
    return map;
  }, [closeFloatingOrRouteApp]);

  const handleOpenSwitcher = useCallback(() => {
    const activeIdx = enabledApps.findIndex((a) => a.id === stateRef.current.activeApp);
    setSwitcherIndex(activeIdx >= 0 ? activeIdx : 0);
    setSwitcherOpen(true);
  }, [enabledApps]);

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
        onOpenSwitcher={handleOpenSwitcher}
        onCloseAllApps={handleCloseAllApps}
        onQuitApp={handleQuitDockApp}
      />

      <AppSwitcher
        isOpen={switcherOpen}
        apps={enabledApps}
        selectedIndex={switcherIndex}
        runningApps={runningApps}
        onSelectIndex={setSwitcherIndex}
        onCommit={(id) => {
          clearSwitcherCommitTimer();
          setSwitcherOpen(false);
          handleSelectDockApp(id);
        }}
        onClose={() => {
          clearSwitcherCommitTimer();
          setSwitcherOpen(false);
        }}
      />

      {floatingAppIds.map((id, idx) => {
        const win = state.windows[id];
        const handlers = windowHandlers[id];
        const pinSlot = pinLayout ? pinLayout.indexOf(id) : -1;
        // In Pin Mode, clicking a widget swaps it into the centre instead of unpinning.
        const handleWidgetOpen = pinSlot > 0
          ? () => dispatch({ type: "FOCUS_PIN_APP", id })
          : handlers.onTogglePin;
        if (id === hostWindowApp) {
          // The host page lives in the Astro frame; while another app holds the
          // centre, a widget stands in for it in the column.
          if (!isHostPinDocked) return null;
          return (
            <Suspense key={`${id}-widget`} fallback={null}>
              <DesktopWidget
                id={id}
                title={appTitles[id]}
                zIndex={getWindowZIndex(win)}
                index={idx}
                slot={pinSlot - 1}
                onFocus={handlers.onFocus}
                onUnpin={handleWidgetOpen}
                onClose={handlers.onClose}
              />
            </Suspense>
          );
        }
        const isPinCenter = pinCenter === id;
        if (!isCompactViewport && win.isOpen && !win.isMinimized && win.isPinned && !isPinCenter) {
          return (
            <Suspense key={`${id}-widget`} fallback={null}>
              <DesktopWidget
                id={id}
                title={appTitles[id]}
                zIndex={getWindowZIndex(win)}
                index={idx}
                slot={pinSlot > 0 ? pinSlot - 1 : undefined}
                onFocus={handlers.onFocus}
                onUnpin={handleWidgetOpen}
                onClose={handlers.onClose}
              />
            </Suspense>
          );
        }
        return (
          <Suspense key={id} fallback={null}>
            <AppWindow
              windowState={win}
              title={appTitles[id]}
              isActive={state.activeApp === id}
              isFullBleed={id === "spotify" || id === "photos" || id === "workspace"}
              isPinCenter={isPinCenter}
              onFocus={handlers.onFocus}
              onClose={handlers.onClose}
              onMinimize={handlers.onMinimize}
              onToggleMaximize={handlers.onToggleMaximize}
              onTogglePin={handlers.onTogglePin}
              onTile={handlers.onTile}
              onMove={handlers.onMove}
            >
              {renderAppContent(id)}
            </AppWindow>
          </Suspense>
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
            <span>
              {state.windows[hostWindowApp].isPinned ? "Unpin widget" : "Pin as widget"}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

export default DesktopShell;
