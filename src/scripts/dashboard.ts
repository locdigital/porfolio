import { onPageLoad } from "./page-lifecycle";
import "./workspace-navigation";
import { hostWindowStorageKey, readHostWindowState, type HostWindowState } from "../lib/host-window-state";

const root = document.documentElement;
root.classList.add("js");

function setupMobileDrawer(signal: AbortSignal) {
  const toggleBtn = document.getElementById("mobile-drawer-toggle");
  const closeBtn = document.getElementById("dash-drawer-close");
  const sidebar = document.getElementById("dash-sidebar");
  const backdrop = document.getElementById("dash-drawer-backdrop");
  const main = document.getElementById("main-content");
  const frame = toggleBtn?.closest<HTMLElement>(".mac-window-container");
  const compactLayout = window.matchMedia("(max-width: 1023px)");
  const isCompact = () => compactLayout.matches || Boolean(toggleBtn?.getClientRects().length);
  const bodyOverflow = document.body.style.overflow;
  const rootOverflow = root.style.overflow;

  function openDrawer() {
    if (!isCompact()) return;
    if (sidebar) sidebar.inert = false;
    sidebar?.classList.add("is-open");
    backdrop?.classList.add("is-open");
    toggleBtn?.setAttribute("aria-expanded", "true");
    if (main) main.inert = true;
    if (compactLayout.matches) {
      document.body.style.overflow = "hidden";
      root.style.overflow = "hidden";
    }
    closeBtn?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const wasOpen = sidebar?.classList.contains("is-open");
    sidebar?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    toggleBtn?.setAttribute("aria-expanded", "false");
    if (main) main.inert = false;
    document.body.style.overflow = bodyOverflow;
    root.style.overflow = rootOverflow;
    if (wasOpen && restoreFocus && isCompact()) toggleBtn?.focus();
    if (sidebar) sidebar.inert = isCompact();
  }

  toggleBtn?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.contains("is-open");
    if (isOpen) closeDrawer();
    else openDrawer();
  }, { signal });

  closeBtn?.addEventListener("click", () => closeDrawer(), { signal });
  backdrop?.addEventListener("click", () => closeDrawer(), { signal });
  sidebar?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a[href]")) closeDrawer(false);
  }, { signal });

  compactLayout.addEventListener("change", () => closeDrawer(false), { signal });
  if (frame && typeof ResizeObserver !== "undefined") {
    let compact = isCompact();
    const observer = new ResizeObserver(() => {
      const resized = isCompact();
      if (resized === compact) return;
      compact = resized;
      closeDrawer(false);
    });
    observer.observe(frame);
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  }
  signal.addEventListener("abort", () => closeDrawer(false), { once: true });
  closeDrawer(false);

  window.addEventListener("keydown", (event) => {
    if (!sidebar?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      closeDrawer();
    }
    if (event.key === "Tab") {
      const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }, { signal });
}

let activeWindowAnimation: Animation | undefined;

export function cancelWindowAnimation() {
  if (activeWindowAnimation) {
    activeWindowAnimation.cancel();
    activeWindowAnimation = undefined;
  }
}

function skipActiveViewTransition() {
  const doc = document as Document & {
    activeViewTransition?: { skipTransition?: () => void };
  };
  doc.activeViewTransition?.skipTransition?.();
}

function setupWindowControls(signal: AbortSignal) {
  if (
    root.classList.contains("is-embedded-window") ||
    window.self !== window.top ||
    new URLSearchParams(window.location.search).get("embed") === "1"
  ) {
    return;
  }
  const app = root.dataset.desktopApp;
  const appLabel = app === "photos" ? "Photos" : "workspace";
  const storageKey = hostWindowStorageKey(app);
  const windowFrame = document.querySelector<HTMLElement>(".mac-window-container");
  const closeButton = document.querySelector<HTMLButtonElement>('[data-window-action="close"]');
  const minimizeButton = document.querySelector<HTMLButtonElement>('[data-window-action="minimize"]');
  const maximizeButton = document.querySelector<HTMLButtonElement>('[data-window-action="maximize"]');
  const restoreButton = document.querySelector<HTMLButtonElement>('[data-window-action="restore"]');

  if (!windowFrame || !closeButton || !minimizeButton || !maximizeButton || !restoreButton) return;

  type WindowState = HostWindowState;

  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const readState = (): WindowState => {
    try {
      return readHostWindowState(sessionStorage, app);
    } catch {
      return { closed: false, minimized: false, maximized: false };
    }
  };

  const syncRootClasses = (state: WindowState) => {
    root.classList.toggle("window-closed", state.closed);
    root.classList.toggle("window-minimized", !state.closed && state.minimized);
    root.classList.toggle("window-maximized", !state.closed && !state.minimized && state.maximized);
  };

  const getCurrentState = (): WindowState => ({
    closed: windowFrame.hidden,
    minimized: windowFrame.classList.contains("is-minimized"),
    maximized: windowFrame.classList.contains("is-maximized"),
  });

  const saveState = () => {
    const state = getCurrentState();
    syncRootClasses(state);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  };

  const syncControls = () => {
    const minimized = windowFrame.classList.contains("is-minimized");
    const maximized = windowFrame.classList.contains("is-maximized");

    minimizeButton.setAttribute("aria-pressed", String(minimized));
    minimizeButton.setAttribute("aria-label", `${minimized ? "Restore" : "Minimize"} ${appLabel}`);
    minimizeButton.title = `${minimized ? "Restore" : "Minimize"} ${appLabel}`;
    maximizeButton.setAttribute("aria-pressed", String(maximized));
    maximizeButton.setAttribute("aria-label", maximized ? "Restore window size" : `Maximize ${appLabel}`);
    maximizeButton.title = maximized ? "Restore window size" : `Maximize ${appLabel}`;
  };

  const applyState = ({ closed, minimized, maximized }: WindowState) => {
    windowFrame.hidden = closed;
    windowFrame.classList.toggle("is-minimized", !closed && minimized);
    windowFrame.classList.toggle("is-maximized", !closed && maximized);
    restoreButton.hidden = !closed;
    syncRootClasses({ closed, minimized: !closed && minimized, maximized: !closed && maximized });
    syncControls();
  };

  const animateFrameChange = (mutate: () => void) => {
    skipActiveViewTransition();

    if (prefersReducedMotion() || typeof windowFrame.animate !== "function") {
      cancelWindowAnimation();
      mutate();
      syncControls();
      saveState();
      return;
    }

    const first = windowFrame.getBoundingClientRect();
    const firstRadius = getComputedStyle(windowFrame).borderRadius;

    cancelWindowAnimation();
    mutate();
    syncControls();
    saveState();

    const last = windowFrame.getBoundingClientRect();
    if (first.width <= 0 || first.height <= 0 || last.width <= 0 || last.height <= 0) return;

    const style = getComputedStyle(windowFrame);
    const lastRadius = style.borderRadius;
    const lastTransform = style.transform;
    const baseTransform = lastTransform && lastTransform !== "none" ? lastTransform : "";

    const dx = first.left + first.width / 2 - (last.left + last.width / 2);
    const dy = first.top + first.height / 2 - (last.top + last.height / 2);
    const sx = first.width / last.width;
    const sy = first.height / last.height;

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.002 && Math.abs(sy - 1) < 0.002) {
      return;
    }

    const fromTransform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})${baseTransform ? ` ${baseTransform}` : ""}`;
    const toTransform = baseTransform || "translate3d(0, 0, 0) scale(1, 1)";

    windowFrame.style.willChange = "transform";
    const animation = windowFrame.animate(
      [
        { transform: fromTransform, borderRadius: firstRadius },
        { transform: toTransform, borderRadius: lastRadius },
      ],
      {
        duration: parseFloat(style.getPropertyValue("--motion-duration-normal")),
        easing: style.getPropertyValue("--motion-ease-out").trim(),
      }
    );

    activeWindowAnimation = animation;
    const cleanup = () => {
      if (activeWindowAnimation === animation) {
        activeWindowAnimation = undefined;
      }
      windowFrame.style.willChange = "";
    };
    animation.addEventListener("finish", cleanup, { once: true });
    animation.addEventListener("cancel", cleanup, { once: true });
  };

  const normalizedApp = app === "photos" ? "photos" : "workspace";
  const notifyShell = (
    action: "close" | "minimize" | "restore" | "maximize",
    extra?: { maximized?: boolean },
  ) => {
    window.dispatchEvent(
      new CustomEvent("desktop:host-window-action", {
        detail: { action, app: normalizedApp, ...extra },
      }),
    );
  };

  let resetHostGeometry: (() => void) | null = null;

  const titlebar = windowFrame.querySelector<HTMLElement>(".desktop-titlebar");
  const clearHostTileStyles = (notifyLayout = true) => {
    if (windowFrame.classList.contains("is-tiled") || windowFrame.classList.contains("is-pinned")) {
      windowFrame.classList.remove("is-tiled", "is-pinned");
      windowFrame.style.position = "";
      windowFrame.style.left = "";
      windowFrame.style.top = "";
      windowFrame.style.right = "";
      windowFrame.style.bottom = "";
      windowFrame.style.width = "";
      windowFrame.style.height = "";
      windowFrame.style.margin = "";
      if (notifyLayout) {
        window.dispatchEvent(new CustomEvent("desktop:clear-host-layout"));
      }
    }
  };

  const closeHostWindow = (emitToShell = true) => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    clearHostTileStyles(false);
    resetHostGeometry?.();
    const mainEl = document.getElementById("main-content");
    if (mainEl) mainEl.scrollTop = 0;
    windowFrame.hidden = true;
    windowFrame.classList.remove("is-minimized", "is-maximized");
    restoreButton.hidden = false;
    syncControls();
    saveState();
    if (emitToShell) {
      notifyShell("close");
    }
  };

  const restoreHostWindow = (emitToShell = true) => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    windowFrame.hidden = false;
    windowFrame.classList.remove("is-minimized");
    restoreButton.hidden = true;
    syncControls();
    saveState();
    if (emitToShell) {
      notifyShell("restore");
    }
  };

  const minimizeHostWindow = (emitToShell = true) => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    windowFrame.classList.add("is-minimized");
    syncControls();
    saveState();
    if (emitToShell) {
      notifyShell("minimize");
    }
  };

  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeHostWindow(true);
  }, { signal });

  restoreButton.addEventListener("click", () => {
    restoreHostWindow(true);
    closeButton.focus();
  }, { signal });

  minimizeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (windowFrame.classList.contains("is-minimized")) {
      restoreHostWindow(true);
    } else {
      minimizeHostWindow(true);
    }
  }, { signal });

  window.addEventListener("desktop:host-command", (event) => {
    const command = (event as CustomEvent<{ action?: "close" | "minimize" | "restore" }>).detail?.action;
    if (command === "close") {
      closeHostWindow(false);
    } else if (command === "minimize") {
      minimizeHostWindow(false);
    } else if (command === "restore") {
      restoreHostWindow(false);
    }
  }, { signal });

  const toggleMaximize = () => {
    const wasTiledOrPinned =
      windowFrame.classList.contains("is-tiled") || windowFrame.classList.contains("is-pinned");
    animateFrameChange(() => {
      clearHostTileStyles();
      windowFrame.classList.remove("is-minimized");
      if (wasTiledOrPinned) {
        windowFrame.classList.add("is-maximized");
      } else {
        windowFrame.classList.toggle("is-maximized");
      }
    });
    notifyShell("maximize", { maximized: windowFrame.classList.contains("is-maximized") });
  };
  window.addEventListener("desktop:unmaximize-host", () => {
    if (!windowFrame.classList.contains("is-maximized") && !root.classList.contains("window-maximized")) {
      return;
    }
    cancelWindowAnimation();
    windowFrame.classList.remove("is-maximized");
    syncControls();
    saveState();
  }, { signal });
  titlebar?.addEventListener("dblclick", (event) => {
    if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea")) return;
    event.preventDefault();
    toggleMaximize();
  }, { signal });

  if (titlebar) {
    const offsetStorageKey = `${app}-window-offset`;
    const sizeStorageKey = `${app}-window-size`;
    const MIN_W = 420;
    const MIN_H = 360;
    let offsetX = 0;
    let offsetY = 0;
    let customSize: { width: number; height: number } | null = null;

    const applyOffset = (x: number, y: number, persist = true) => {
      offsetX = x;
      offsetY = y;
      windowFrame.style.setProperty("--window-offset-x", `${x}px`);
      windowFrame.style.setProperty("--window-offset-y", `${y}px`);
      if (persist) {
        try {
          sessionStorage.setItem(offsetStorageKey, JSON.stringify({ x, y }));
        } catch {}
      }
    };

    const applySize = (width: number, height: number, persist = true) => {
      customSize = { width, height };
      windowFrame.style.setProperty("--window-width", `${width}px`);
      windowFrame.style.setProperty("--window-height", `${height}px`);
      if (persist) {
        try {
          sessionStorage.setItem(sizeStorageKey, JSON.stringify({ width, height }));
        } catch {}
      }
    };

    resetHostGeometry = () => {
      offsetX = 0;
      offsetY = 0;
      customSize = null;
      windowFrame.style.removeProperty("--window-offset-x");
      windowFrame.style.removeProperty("--window-offset-y");
      windowFrame.style.removeProperty("--window-width");
      windowFrame.style.removeProperty("--window-height");
      try {
        sessionStorage.removeItem(offsetStorageKey);
        sessionStorage.removeItem(sizeStorageKey);
      } catch {}
    };

    try {
      const savedOffset = JSON.parse(sessionStorage.getItem(offsetStorageKey) || "null");
      if (
        savedOffset &&
        typeof savedOffset.x === "number" &&
        typeof savedOffset.y === "number" &&
        Number.isFinite(savedOffset.x) &&
        Number.isFinite(savedOffset.y)
      ) {
        applyOffset(savedOffset.x, savedOffset.y, false);
      }
      const savedSize = JSON.parse(sessionStorage.getItem(sizeStorageKey) || "null");
      if (
        savedSize &&
        typeof savedSize.width === "number" &&
        typeof savedSize.height === "number" &&
        Number.isFinite(savedSize.width) &&
        Number.isFinite(savedSize.height)
      ) {
        applySize(savedSize.width, savedSize.height, false);
      }
    } catch {}

    let dragState: { startX: number; startY: number; origX: number; origY: number; dragging: boolean } | null = null;

    const clampOffset = (x: number, y: number) => {
      const rect = windowFrame.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(0, (vw + rect.width) / 2 - 160);
      const minY = -Math.max(0, (vh - rect.height) / 2);
      const maxY = Math.max(0, (vh + rect.height) / 2 - 56);
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    };

    titlebar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (
        window.innerWidth < 1024 ||
        windowFrame.classList.contains("is-maximized") ||
        windowFrame.classList.contains("is-tiled") ||
        windowFrame.classList.contains("is-pinned")
      ) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("button, a, input")) return;

      dragState = {
        startX: event.clientX,
        startY: event.clientY,
        origX: offsetX,
        origY: offsetY,
        dragging: false,
      };
    }, { signal });

    titlebar.addEventListener("pointermove", (event) => {
      if (!dragState) return;
      if (event.buttons !== 1) {
        dragState = null;
        windowFrame.classList.remove("is-dragging");
        return;
      }
      if (!dragState.dragging) {
        if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) < 5) return;
        dragState.dragging = true;
        titlebar.setPointerCapture(event.pointerId);
        windowFrame.classList.add("is-dragging");
      }
      const next = clampOffset(
        dragState.origX + (event.clientX - dragState.startX),
        dragState.origY + (event.clientY - dragState.startY),
      );
      applyOffset(next.x, next.y, false);
    }, { signal });

    const endDrag = (event: PointerEvent) => {
      if (!dragState) return;
      dragState = null;
      windowFrame.classList.remove("is-dragging");
      if (titlebar.hasPointerCapture(event.pointerId)) {
        titlebar.releasePointerCapture(event.pointerId);
      }
      applyOffset(offsetX, offsetY, true);
    };

    titlebar.addEventListener("pointerup", endDrag, { signal });
    titlebar.addEventListener("pointercancel", endDrag, { signal });

    // Resize handles (w, e, s, sw, se)
    type HostResizeEdge = "w" | "e" | "s" | "sw" | "se";
    let resizeState: {
      edge: HostResizeEdge;
      startX: number;
      startY: number;
      origW: number;
      origH: number;
      origOffsetX: number;
      origOffsetY: number;
    } | null = null;

    const resizeHandles = windowFrame.querySelectorAll<HTMLElement>("[data-window-resize]");
    resizeHandles.forEach((handle) => {
      const edge = handle.dataset.windowResize as HostResizeEdge | undefined;
      if (!edge) return;

      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (
          window.innerWidth < 1024 ||
          windowFrame.classList.contains("is-maximized") ||
          windowFrame.classList.contains("is-tiled")
        ) {
          return;
        }
        event.stopPropagation();
        const rect = windowFrame.getBoundingClientRect();
        handle.setPointerCapture(event.pointerId);
        resizeState = {
          edge,
          startX: event.clientX,
          startY: event.clientY,
          origW: rect.width,
          origH: rect.height,
          origOffsetX: offsetX,
          origOffsetY: offsetY,
        };
      }, { signal });

      handle.addEventListener("pointermove", (event) => {
        if (!resizeState) return;
        const dx = event.clientX - resizeState.startX;
        const dy = event.clientY - resizeState.startY;
        const maxW = Math.min(1500, Math.max(MIN_W, window.innerWidth - 88));
        const maxH = Math.max(MIN_H, window.innerHeight - 40);

        const isEast = resizeState.edge === "e" || resizeState.edge === "se";
        const isWest = resizeState.edge === "w" || resizeState.edge === "sw";
        const isSouth = resizeState.edge === "s" || resizeState.edge === "se" || resizeState.edge === "sw";

        const nextW = isEast
          ? Math.max(MIN_W, Math.min(maxW, resizeState.origW + dx))
          : isWest
            ? Math.max(MIN_W, Math.min(maxW, resizeState.origW - dx))
            : resizeState.origW;
        const nextH = isSouth
          ? Math.max(MIN_H, Math.min(maxH, resizeState.origH + dy))
          : resizeState.origH;

        applySize(nextW, nextH, false);
        const nextOffsetX = isWest
          ? resizeState.origOffsetX - (nextW - resizeState.origW) / 2
          : resizeState.origOffsetX + (nextW - resizeState.origW) / 2;
        const nextOffsetY = resizeState.origOffsetY + (nextH - resizeState.origH) / 2;
        applyOffset(nextOffsetX, nextOffsetY, false);
      }, { signal });

      const endResize = (event: PointerEvent) => {
        if (!resizeState) return;
        resizeState = null;
        if (handle.hasPointerCapture(event.pointerId)) {
          handle.releasePointerCapture(event.pointerId);
        }
        if (customSize) {
          applySize(customSize.width, customSize.height, true);
        }
        applyOffset(offsetX, offsetY, true);
      };

      handle.addEventListener("pointerup", endResize, { signal });
      handle.addEventListener("pointercancel", endResize, { signal });
    });
  }

  maximizeButton.addEventListener("click", toggleMaximize, { signal });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || windowFrame.hidden || event.defaultPrevented) return;
    if (document.querySelector('[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper]')) return;
    if (windowFrame.classList.contains("is-minimized") || !windowFrame.classList.contains("is-maximized")) return;

    animateFrameChange(() => {
      windowFrame.classList.remove("is-maximized");
    });
    notifyShell("maximize", { maximized: false });
    maximizeButton.focus();
  }, { signal });

  signal.addEventListener("abort", cancelWindowAnimation, { once: true });
  applyState(readState());
}

let activeFrame: Element | null = null;
let windowController: AbortController | undefined;
function bindWindowControls() {
  const frame = document.querySelector(".mac-window-container");
  if (frame === activeFrame) return;
  windowController?.abort();
  windowController = new AbortController();
  activeFrame = frame;
  setupWindowControls(windowController.signal);
}

bindWindowControls();
document.addEventListener("astro:after-swap", bindWindowControls);
onPageLoad((signal) => {
  bindWindowControls();
  root.classList.add("js");
  try {
    localStorage.removeItem("bgm-state");
  } catch {}
  setupMobileDrawer(signal);

  if (window.self !== window.top && root.dataset.desktopApp === "photos") {
    const notifyEmbeddedPhotosUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("embed");
      const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
      window.parent.postMessage({ type: "photos:url-change", url: cleanUrl }, window.location.origin);
    };
    notifyEmbeddedPhotosUrl();
    window.addEventListener("hashchange", notifyEmbeddedPhotosUrl, { signal });
  }
});

