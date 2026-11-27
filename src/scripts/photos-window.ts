import { hostWindowStorageKey, readHostWindowState, type HostWindowState } from "../lib/host-window-state";

const MIN_WINDOW_WIDTH = 420;
const MIN_WINDOW_HEIGHT = 360;

type ResizeEdge = "e" | "w" | "s" | "se" | "sw";

function initPhotosWindow() {
  const root = document.documentElement;
  const frame = document.querySelector<HTMLElement>(".photos-window-container");
  const restoreBtn = document.querySelector<HTMLButtonElement>('[data-window-action="restore"]');
  if (!frame || root.classList.contains("is-embedded-window")) return;

  const storageKey = hostWindowStorageKey("photos");
  const isDesktop = () => window.innerWidth >= 1024;
  let state: HostWindowState = readHostWindowState(sessionStorage, "photos");
  let offsetX = 0;
  let offsetY = 0;
  let customSize: { width: number; height: number } | null = null;

  const persist = () => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  };

  const applyTransform = () => {
    frame.style.setProperty("--window-offset-x", `${Math.round(offsetX)}px`);
    frame.style.setProperty("--window-offset-y", `${Math.round(offsetY)}px`);
  };

  const applySize = () => {
    if (!customSize || state.maximized || frame.classList.contains("is-tiled") || frame.classList.contains("is-pinned")) {
      frame.style.removeProperty("--window-width");
      frame.style.removeProperty("--window-height");
      return;
    }
    frame.style.setProperty("--window-width", `${Math.round(customSize.width)}px`);
    frame.style.setProperty("--window-height", `${Math.round(customSize.height)}px`);
  };

  const renderState = () => {
    const activeDesktop = isDesktop();
    const closed = activeDesktop && state.closed;
    const minimized = activeDesktop && !closed && state.minimized;
    const maximized = activeDesktop && !closed && !minimized && state.maximized;

    frame.hidden = closed;
    frame.classList.toggle("is-minimized", minimized);
    frame.classList.toggle("is-maximized", maximized);
    root.classList.toggle("window-closed", closed);
    root.classList.toggle("window-minimized", minimized);
    root.classList.toggle("window-maximized", maximized);
    if (restoreBtn) restoreBtn.hidden = !(closed || minimized);

    const maxBtn = frame.querySelector<HTMLButtonElement>('[data-window-action="maximize"]');
    if (maxBtn) maxBtn.setAttribute("aria-pressed", String(maximized));
    const minBtn = frame.querySelector<HTMLButtonElement>('[data-window-action="minimize"]');
    if (minBtn) minBtn.setAttribute("aria-pressed", String(minimized));

    if (maximized) {
      offsetX = 0;
      offsetY = 0;
    }
    applyTransform();
    applySize();
  };

  const dispatchHostAction = (action: "close" | "minimize" | "restore" | "maximize", maximized?: boolean) => {
    window.dispatchEvent(
      new CustomEvent("desktop:host-window-action", {
        detail: { action, app: "photos", maximized },
      }),
    );
  };

  renderState();

  frame.addEventListener("click", (event) => {
    const btn = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-window-action]") : null;
    if (!btn) return;
    const action = btn.getAttribute("data-window-action");
    if (action === "close") {
      state = { closed: true, minimized: false, maximized: false };
      persist();
      renderState();
      dispatchHostAction("close");
    } else if (action === "minimize") {
      state = { closed: false, minimized: true, maximized: state.maximized };
      persist();
      renderState();
      dispatchHostAction("minimize");
    } else if (action === "maximize") {
      const next = !state.maximized;
      state = { closed: false, minimized: false, maximized: next };
      if (next) {
        window.dispatchEvent(new CustomEvent("desktop:clear-host-layout"));
      }
      persist();
      renderState();
      dispatchHostAction("maximize", next);
    }
  });

  restoreBtn?.addEventListener("click", () => {
    state = { closed: false, minimized: false, maximized: state.maximized };
    persist();
    renderState();
    dispatchHostAction("restore");
  });

  window.addEventListener("desktop:host-command", (event) => {
    const action = (event as CustomEvent<{ action?: string }>).detail?.action;
    if (action === "restore") {
      state = { closed: false, minimized: false, maximized: state.maximized };
      persist();
      renderState();
    } else if (action === "close") {
      state = { closed: true, minimized: false, maximized: false };
      persist();
      renderState();
    }
  });

  window.addEventListener("desktop:unmaximize-host", () => {
    if (state.maximized) {
      state = { ...state, maximized: false };
      persist();
      renderState();
    }
  });

  // Titlebar drag
  const titlebar = frame.querySelector<HTMLElement>(".desktop-titlebar");
  titlebar?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !isDesktop()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, .mac-traffic-lights")) return;
    if (state.maximized || frame.classList.contains("is-tiled") || frame.classList.contains("is-pinned")) return;

    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = offsetX;
    const initialY = offsetY;
    const rect = frame.getBoundingClientRect();
    const maxX = Math.max(0, (window.innerWidth - rect.width) / 2 - 16);
    const maxY = Math.max(0, (window.innerHeight - rect.height) / 2 - 16);

    frame.classList.add("is-dragging");
    const onMove = (moveEvent: PointerEvent) => {
      offsetX = Math.max(-maxX, Math.min(maxX, initialX + (moveEvent.clientX - startX)));
      offsetY = Math.max(-maxY, Math.min(maxY, initialY + (moveEvent.clientY - startY)));
      applyTransform();
    };
    const onUp = () => {
      frame.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });

  // Edge resize handles
  frame.querySelectorAll<HTMLElement>("[data-window-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !isDesktop()) return;
      if (state.maximized || frame.classList.contains("is-tiled") || frame.classList.contains("is-pinned")) return;
      const edge = handle.dataset.windowResize as ResizeEdge | undefined;
      if (!edge) return;

      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const rect = frame.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      const startOffX = offsetX;
      const startOffY = offsetY;

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const maxW = Math.max(MIN_WINDOW_WIDTH, window.innerWidth - 96);
        const maxH = Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - 24);
        let nextW = startW;
        let nextH = startH;
        let nextOffX = startOffX;
        let nextOffY = startOffY;

        if (edge === "e" || edge === "se") {
          nextW = Math.max(MIN_WINDOW_WIDTH, Math.min(maxW, startW + dx));
          nextOffX = startOffX + (nextW - startW) / 2;
        } else if (edge === "w" || edge === "sw") {
          nextW = Math.max(MIN_WINDOW_WIDTH, Math.min(maxW, startW - dx));
          nextOffX = startOffX - (nextW - startW) / 2;
        }
        if (edge === "s" || edge === "se" || edge === "sw") {
          nextH = Math.max(MIN_WINDOW_HEIGHT, Math.min(maxH, startH + dy));
          nextOffY = startOffY + (nextH - startH) / 2;
        }
        customSize = { width: nextW, height: nextH };
        offsetX = nextOffX;
        offsetY = nextOffY;
        applySize();
        applyTransform();
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });
  });

  window.addEventListener("resize", renderState);
}

initPhotosWindow();
