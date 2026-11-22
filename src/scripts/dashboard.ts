import { onPageLoad } from "./page-lifecycle";
import "./workspace-navigation";

const root = document.documentElement;
root.classList.add("js");

function setupMobileDrawer(signal: AbortSignal) {
  const toggleBtn = document.getElementById("mobile-drawer-toggle");
  const closeBtn = document.getElementById("dash-drawer-close");
  const sidebar = document.getElementById("dash-sidebar");
  const backdrop = document.getElementById("dash-drawer-backdrop");
  const main = document.getElementById("main-content");
  const compactLayout = window.matchMedia("(max-width: 1023px)");
  const bodyOverflow = document.body.style.overflow;
  const rootOverflow = root.style.overflow;

  function openDrawer() {
    if (!compactLayout.matches) return;
    if (sidebar) sidebar.inert = false;
    sidebar?.classList.add("is-open");
    backdrop?.classList.add("is-open");
    toggleBtn?.setAttribute("aria-expanded", "true");
    if (main) main.inert = true;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";
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
    if (wasOpen && restoreFocus && compactLayout.matches) toggleBtn?.focus();
    if (sidebar) sidebar.inert = compactLayout.matches;
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
  const storageKey = "workspace-window-state";
  const windowFrame = document.querySelector<HTMLElement>(".mac-window-container");
  const closeButton = document.querySelector<HTMLButtonElement>('[data-window-action="close"]');
  const minimizeButton = document.querySelector<HTMLButtonElement>('[data-window-action="minimize"]');
  const maximizeButton = document.querySelector<HTMLButtonElement>('[data-window-action="maximize"]');
  const restoreButton = document.querySelector<HTMLButtonElement>('[data-window-action="restore"]');

  if (!windowFrame || !closeButton || !minimizeButton || !maximizeButton || !restoreButton) return;

  type WindowState = {
    closed: boolean;
    minimized: boolean;
    maximized: boolean;
  };

  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const readState = (): WindowState => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as Partial<WindowState> | null;
      return {
        closed: saved?.closed === true,
        minimized: saved?.minimized === true,
        maximized: saved?.maximized === true,
      };
    } catch {
      return { closed: false, minimized: false, maximized: false };
    }
  };

  const syncRootClasses = (state: WindowState) => {
    root.classList.toggle("window-closed", state.closed);
    root.classList.toggle("window-minimized", !state.closed && state.minimized);
    root.classList.toggle("window-maximized", !state.closed && state.maximized);
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
    minimizeButton.setAttribute("aria-label", minimized ? "Restore workspace" : "Minimize workspace");
    minimizeButton.title = minimized ? "Restore workspace" : "Minimize workspace";
    maximizeButton.setAttribute("aria-pressed", String(maximized));
    maximizeButton.setAttribute("aria-label", maximized ? "Restore window size" : "Maximize workspace");
    maximizeButton.title = maximized ? "Restore window size" : "Maximize workspace";
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

    const lastRadius = getComputedStyle(windowFrame).borderRadius;
    const lastTransform = getComputedStyle(windowFrame).transform;
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
        duration: 210,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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

  closeButton.addEventListener("click", () => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    windowFrame.hidden = true;
    windowFrame.classList.remove("is-minimized", "is-maximized");
    restoreButton.hidden = false;
    restoreButton.focus();
    syncControls();
    saveState();
  }, { signal });

  restoreButton.addEventListener("click", () => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    windowFrame.hidden = false;
    restoreButton.hidden = true;
    closeButton.focus();
    syncControls();
    saveState();
  }, { signal });

  minimizeButton.addEventListener("click", () => {
    skipActiveViewTransition();
    cancelWindowAnimation();
    windowFrame.classList.toggle("is-minimized");
    if (windowFrame.classList.contains("is-minimized")) {
      windowFrame.classList.remove("is-maximized");
    }
    syncControls();
    saveState();
  }, { signal });

  const titlebar = windowFrame.querySelector<HTMLElement>(".desktop-titlebar");
  titlebar?.addEventListener("dblclick", (event) => {
    if (event.target instanceof Element && event.target.closest("button, a, input")) return;
    animateFrameChange(() => {
      if (windowFrame.classList.contains("is-minimized")) {
        windowFrame.classList.remove("is-minimized");
      } else {
        windowFrame.classList.toggle("is-maximized");
      }
    });
  }, { signal });

  maximizeButton.addEventListener("click", () => {
    animateFrameChange(() => {
      windowFrame.classList.remove("is-minimized");
      windowFrame.classList.toggle("is-maximized");
    });
  }, { signal });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || windowFrame.hidden || event.defaultPrevented) return;
    if (document.querySelector('[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper]')) return;
    if (!windowFrame.classList.contains("is-minimized") && !windowFrame.classList.contains("is-maximized")) return;

    animateFrameChange(() => {
      windowFrame.classList.remove("is-minimized", "is-maximized");
    });
    maximizeButton.focus();
  }, { signal });

  signal.addEventListener("abort", cancelWindowAnimation, { once: true });
  applyState(readState());
}

onPageLoad((signal) => {
  root.classList.add("js");
  try {
    localStorage.removeItem("bgm-state");
  } catch {}
  setupMobileDrawer(signal);
  setupWindowControls(signal);

  return () => {
    document.body.style.overflow = "";
  };
});

