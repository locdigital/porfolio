import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from "astro:transitions/client";

import { shuffleGearGrid } from "../lib/gear-shuffle";
import { hostWindowStorageKey, readHostWindowState } from "../lib/host-window-state";

type ScrollPosition = { top: number; left: number };

// Astro restores window scroll. Desktop uses a separate, scrolling <main>.
const positions = new Map<number, ScrollPosition>();
let activeIndex: number = history.state?.index ?? 0;
let activePage = location.pathname + location.search;
let pending: { traverse: boolean; hash: string; oldTop: number } | undefined;

const mainContent = () => document.getElementById("main-content");

function rememberScroll() {
  const main = mainContent();
  if (main) positions.set(activeIndex, { top: main.scrollTop, left: main.scrollLeft });
}

function restoreScroll(index: number) {
  const main = mainContent();
  const position = positions.get(index) ?? history.state?.workspaceScroll;
  if (main && position) {
    main.scrollTop = position.top;
    main.scrollLeft = position.left;
  }
}

function scrollToHash(hash: string) {
  if (!hash) return;
  try {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  } catch {
    // Malformed fragments still navigate normally through Astro.
  }
}

function isLocalHashLink(event: MouseEvent) {
  const link = event.target instanceof Element ? event.target.closest("a") : null;
  return link && link.origin === location.origin && link.pathname + link.search === activePage && link.hash;
}

function clearNavigationFeedback() {
  document.documentElement.classList.remove("is-page-loading");
  document.querySelectorAll(".dash-nav-link.is-pending").forEach((link) => link.classList.remove("is-pending"));
}

// Give immediate visual feedback while Astro fetches and prepares the next page.
document.addEventListener("astro:before-preparation", (event) => {
  const navigation = event as TransitionBeforePreparationEvent;
  document.documentElement.classList.add("is-page-loading");
  const source = navigation.sourceElement instanceof Element
    ? navigation.sourceElement.closest(".dash-nav-link")
    : null;
  source?.classList.add("is-pending");
});

// Hash links are handled synchronously by Astro, without any swap lifecycle.
// Remember the old entry before its click handler, then read the new index after it.
document.addEventListener("click", (event) => {
  if (isLocalHashLink(event)) rememberScroll();
}, { capture: true });
window.addEventListener("click", (event) => {
  if (isLocalHashLink(event)) activeIndex = history.state?.index ?? activeIndex;
});

document.addEventListener("scroll", (event) => {
  if (event.target === mainContent() && history.state?.index === activeIndex) rememberScroll();
}, { capture: true, passive: true });

window.addEventListener("hashchange", () => {
  activeIndex = history.state?.index ?? activeIndex;
});

document.addEventListener("astro:before-swap", (event) => {
  const navigation = event as TransitionBeforeSwapEvent;

  // Preserve window frame state onto the incoming document BEFORE Astro swaps the DOM,
  // so maximized/minimized/closed windows never flash back to default size during navigation.
  const currentRoot = document.documentElement;
  const nextDoc = navigation.newDocument;
  const nextApp = nextDoc.documentElement.dataset.desktopApp;
  const switchingApps = nextApp !== currentRoot.dataset.desktopApp;
  let isClosed = currentRoot.classList.contains("window-closed");
  let isMinimized = !isClosed && currentRoot.classList.contains("window-minimized");
  let isMaximized = !isClosed && currentRoot.classList.contains("window-maximized");
  if (switchingApps) {
    // Opening Photos must not inherit a closed/minimized Workspace (or vice versa).
    isClosed = false;
    isMinimized = false;
    isMaximized = false;
    try {
      isMaximized = readHostWindowState(sessionStorage, nextApp).maximized;
      sessionStorage.setItem(hostWindowStorageKey(nextApp), JSON.stringify({
        closed: false, minimized: false, maximized: isMaximized,
      }));
    } catch {
      // Navigation still opens the destination when storage is unavailable.
    }
  }
  const isAppNavigation = currentRoot.dataset.appNavigation === "true";

  nextDoc.documentElement.classList.toggle("window-closed", isClosed);
  nextDoc.documentElement.classList.toggle("window-minimized", isMinimized);
  nextDoc.documentElement.classList.toggle("window-maximized", isMaximized);
  if (isAppNavigation) nextDoc.documentElement.dataset.appNavigation = "true";

  const nextFrame = nextDoc.querySelector<HTMLElement>(".mac-window-container");
  if (nextFrame) {
    nextFrame.hidden = isClosed;
    nextFrame.classList.toggle("is-minimized", isMinimized);
    nextFrame.classList.toggle("is-maximized", isMaximized);
  }
  const nextRestore = nextDoc.querySelector<HTMLButtonElement>('[data-window-action="restore"]');
  if (nextRestore) {
    nextRestore.hidden = !isClosed;
  }

  rememberScroll();
  // Do not overwrite the destination history entry during a popstate traversal.
  if (history.state?.index === activeIndex) {
    history.replaceState({ ...history.state, workspaceScroll: positions.get(activeIndex) }, "");
  }
  pending = {
    traverse: navigation.navigationType === "traverse",
    hash: navigation.to.hash,
    oldTop: mainContent()?.getBoundingClientRect().top ?? 0,
  };
});

document.addEventListener("astro:after-swap", () => {
  activeIndex = history.state?.index ?? 0;
  activePage = location.pathname + location.search;
  if (pending?.traverse) {
    restoreScroll(activeIndex);
  } else {
    scrollToHash(pending?.hash ?? "");
    rememberScroll();
  }
  const main = mainContent();
  if (main) {
    shuffleGearGrid(main);
    const autoFolders = Array.from(main.querySelectorAll<HTMLElement>(".gf-root[data-auto]"));
    if (autoFolders.length > 0) {
      const folderWidths = autoFolders.map((el) => el.clientWidth);
      autoFolders.forEach((el, i) => {
        const w = folderWidths[i];
        if (w > 0) el.style.setProperty("--gf-k", String(w / 340));
      });
    }
  }
  if (main && pending) {
    const bounds = main.getBoundingClientRect();
    const scale = bounds.height / main.offsetHeight || 1;
    const offset = Math.abs(pending.oldTop - bounds.top) < 1 ? 0 : (pending.oldTop - bounds.top) / scale;
    // Keep the outgoing snapshot at its actual viewport position on long mobile pages.
    document.documentElement.style.setProperty("--page-exit-offset", `${offset}px`);
  }
  main?.focus({ preventScroll: true });
  if (document.documentElement.dataset.appNavigation === "true") {
    window.setTimeout(() => delete document.documentElement.dataset.appNavigation, 260);
  }
  pending = undefined;
});

// Hash-only history navigation does not swap the document or emit swap events.
window.addEventListener("popstate", () => {
  if (location.pathname + location.search !== activePage) return;
  rememberScroll();
  activeIndex = history.state?.index ?? activeIndex;
  restoreScroll(activeIndex);
});

window.addEventListener("pagehide", () => {
  rememberScroll();
  if (history.state?.index === activeIndex) {
    history.replaceState({ ...history.state, workspaceScroll: positions.get(activeIndex) }, "");
  }
});

// Bound memory on long browsing sessions to 80 cached history entries.
document.addEventListener("astro:page-load", () => {
  clearNavigationFeedback();
  if (!positions.has(activeIndex)) {
    restoreScroll(activeIndex);
    rememberScroll();
  }
  while (positions.size > 80) positions.delete(positions.keys().next().value!);
});
