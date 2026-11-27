import {
  supportsViewTransitions,
  swapFunctions,
  type TransitionBeforePreparationEvent,
  type TransitionBeforeSwapEvent,
} from "astro:transitions/client";
import { shuffleGearGrid } from "../lib/gear-shuffle";
import { hostWindowStorageKey, readHostWindowState } from "../lib/host-window-state";

type ScrollPosition = { top: number; left: number };
type ScrollPositions = Record<string, ScrollPosition>;
type NavigationMotion = {
  mode: "page" | "window" | "none";
  compact: boolean;
  matchingElement?: HTMLElement;
  matchingName?: string;
  namedElements: HTMLElement[];
  swapping?: boolean;
};

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const compactLayout = matchMedia("(max-width: 1023px)");
const connection = (navigator as Navigator & {
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
}).connection;
const positions = new Map<number, ScrollPositions>();
const motionByNavigation = new WeakMap<AbortSignal, NavigationMotion>();
const nameOwners = new WeakMap<HTMLElement, NavigationMotion>();
let activeIndex: number = history.state?.index ?? 0;
let activePage = location.pathname + location.search;
let pendingNavigation: AbortSignal | undefined;
let pendingSwap: TransitionBeforeSwapEvent | undefined;

const mainContent = () => document.getElementById("main-content");
const getFrame = (doc: Document) => doc.querySelector<HTMLElement>(".mac-window-container");

function syncPrefetchPolicy(doc: Document) {
  if (!connection) return;
  // Astro 4 changes marked links to tap prefetch on slow connections. A tap
  // already starts the route request, so withhold prefetch until conditions improve.
  const constrained = connection.saveData || connection.effectiveType?.endsWith("2g");
  if (constrained) {
    for (const link of doc.querySelectorAll<HTMLAnchorElement>("a[data-astro-prefetch]")) {
      link.dataset.withheldPrefetch = link.dataset.astroPrefetch ?? "";
      link.removeAttribute("data-astro-prefetch");
    }
  } else {
    for (const link of doc.querySelectorAll<HTMLAnchorElement>("a[data-withheld-prefetch]")) {
      link.dataset.astroPrefetch = link.dataset.withheldPrefetch ?? "";
      delete link.dataset.withheldPrefetch;
    }
  }
}

syncPrefetchPolicy(document);
connection?.addEventListener("change", () => syncPrefetchPolicy(document));

function rememberScroll() {
  const scrollPositions: ScrollPositions = {};
  for (const element of document.querySelectorAll<HTMLElement>("[data-workspace-scroll]")) {
    scrollPositions[element.id] = { top: element.scrollTop, left: element.scrollLeft };
  }
  positions.set(activeIndex, scrollPositions);
}

function restoreScroll(index: number) {
  const scrollPositions = positions.get(index) ?? history.state?.workspaceScroll;
  if (!scrollPositions) return false;
  for (const element of document.querySelectorAll<HTMLElement>("[data-workspace-scroll]")) {
    const position = scrollPositions[element.id];
    if (position) element.scrollTo({ ...position, behavior: "instant" });
  }
  return true;
}

function saveHistoryScroll() {
  // During traversal, history.state already describes the destination.
  if (history.state?.index === activeIndex) {
    history.replaceState({ ...history.state, workspaceScroll: positions.get(activeIndex) }, "");
  }
}

function hashTarget(hash: string) {
  if (!hash) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function isLocalHashLink(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const link = event.target instanceof Element
    ? event.target.closest<HTMLAnchorElement>("a[href]")
    : null;
  return link && (!link.target || link.target === "_self") && link.origin === location.origin &&
    link.pathname + link.search === activePage && link.hash;
}

function clearNavigationFeedback(signal: AbortSignal) {
  if (pendingNavigation !== signal) return;
  pendingNavigation = undefined;
  for (const link of document.querySelectorAll(".dash-nav-link.is-pending")) {
    link.classList.remove("is-pending");
  }
}

function nameForTransition(motion: NavigationMotion, element: HTMLElement, name: string) {
  element.style.setProperty("view-transition-name", name);
  nameOwners.set(element, motion);
  motion.namedElements.push(element);
}

function clearTransitionNames(motion: NavigationMotion) {
  for (const element of motion.namedElements) {
    if (nameOwners.get(element) !== motion) continue;
    element.style.removeProperty("view-transition-name");
    nameOwners.delete(element);
  }
}

function isInsideScrollport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const scrollport = element.closest<HTMLElement>("[data-workspace-scroll]")?.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 &&
    rect.right <= innerWidth && rect.bottom <= innerHeight &&
    (!scrollport || (rect.top >= scrollport.top && rect.left >= scrollport.left &&
      rect.bottom <= scrollport.bottom && rect.right <= scrollport.right));
}

function prepareMotion(navigation: TransitionBeforePreparationEvent): NavigationMotion {
  const nextDoc = navigation.newDocument;
  const currentMain = mainContent();
  const nextMain = nextDoc.getElementById("main-content");
  const motion: NavigationMotion = { mode: "none", compact: compactLayout.matches, namedElements: [] };
  if (!supportsViewTransitions || reducedMotion.matches || !currentMain || !nextMain) return motion;

  // Netflix and Spotify render their own floating frame on their dedicated routes.
  if (currentMain.querySelector(".app-route-fallback") || nextMain.querySelector(".app-route-fallback")) return motion;

  const switchingApps = root.dataset.desktopApp !== nextDoc.documentElement.dataset.desktopApp;
  const currentFrame = getFrame(document);
  const nextFrame = getFrame(nextDoc);
  if (!currentFrame || !nextFrame) return motion;

  motion.mode = switchingApps ? "window" : "page";
  if (motion.compact) return motion;
  if (switchingApps) {
    nameForTransition(motion, currentFrame, "workspace-window-out");
    nameForTransition(motion, nextFrame, "workspace-window-in");
    return motion;
  }

  nameForTransition(motion, currentMain, "workspace-content");
  nameForTransition(motion, nextMain, "workspace-content");

  const candidates = new Map(
    Array.from(nextMain.querySelectorAll<HTMLElement>("[data-motion-share]"))
      .filter((element) => !element.closest("[hidden]"))
      .map((element) => [element.dataset.motionShare, element]),
  );
  const source = navigation.sourceElement?.closest("a");
  const card = source?.closest("article") ?? source ?? currentMain;
  for (const outgoing of card.querySelectorAll<HTMLElement>("[data-motion-share]")) {
    const key = outgoing.dataset.motionShare;
    const incoming = candidates.get(key);
    if (!key || !incoming || !isInsideScrollport(outgoing)) continue;
    if (outgoing instanceof HTMLImageElement && !outgoing.naturalWidth) continue;

    const name = `workspace-shared-${CSS.escape(key)}`;
    nameForTransition(motion, outgoing, name);
    motion.matchingElement = incoming;
    motion.matchingName = name;
    break;
  }
  return motion;
}

document.addEventListener("astro:before-preparation", (event) => {
  const navigation = event as TransitionBeforePreparationEvent;
  const destPath = navigation.to.pathname;
  if (destPath === "/photos" || destPath.startsWith("/photos/")) {
    navigation.preventDefault();
    if (window.self !== window.top) {
      window.parent.postMessage(
        { type: "desktop:open-app", id: "photos", url: `${navigation.to.pathname}${navigation.to.search}${navigation.to.hash}` },
        window.location.origin,
      );
      return;
    }
    window.location.assign(navigation.to.href);
    return;
  }
  pendingNavigation = navigation.signal;
  navigation.sourceElement?.closest(".dash-nav-link")?.classList.add("is-pending");

  const load = navigation.loader;
  navigation.loader = async () => {
    const hash = navigation.to.hash;
    await load();
    if (navigation.defaultPrevented || navigation.signal.aborted) return;
    if (hash && !navigation.to.hash) navigation.to.hash = hash;
    motionByNavigation.set(navigation.signal, prepareMotion(navigation));
  };
  navigation.signal.addEventListener("abort", () => {
    clearNavigationFeedback(navigation.signal);
    const motion = motionByNavigation.get(navigation.signal);
    if (motion && !motion.swapping) clearTransitionNames(motion);
  }, { once: true });
});

// Astro can update hash-only entries without emitting swap events.
document.addEventListener("click", (event) => {
  if (isLocalHashLink(event)) rememberScroll();
}, { capture: true });
window.addEventListener("click", (event) => {
  if (isLocalHashLink(event)) activeIndex = history.state?.index ?? activeIndex;
});
document.addEventListener("scroll", (event) => {
  if (event.target instanceof HTMLElement && event.target.hasAttribute("data-workspace-scroll") &&
    history.state?.index === activeIndex) {
    const element = event.target;
    const scrollPositions = positions.get(activeIndex) ?? {};
    scrollPositions[element.id] = { top: element.scrollTop, left: element.scrollLeft };
    positions.set(activeIndex, scrollPositions);
  }
}, { capture: true, passive: true });

function syncSidebar(nextDoc: Document) {
  const active = nextDoc.querySelector(".dash-nav-link.active")?.getAttribute("href");
  const current = nextDoc.querySelector("#dash-sidebar [aria-current='page']")?.getAttribute("href");
  for (const link of document.querySelectorAll("#dash-sidebar a[href]")) {
    const href = link.getAttribute("href");
    link.classList.toggle("active", link.matches(".dash-nav-link") && href === active);
    if (href === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

document.addEventListener("astro:before-swap", (event) => {
  const navigation = event as TransitionBeforeSwapEvent;
  const nextDoc = navigation.newDocument;
  const nextRoot = nextDoc.documentElement;
  const currentFrame = getFrame(document);
  const nextFrame = getFrame(nextDoc);
  const currentMain = mainContent();
  const nextMain = nextDoc.getElementById("main-content");
  const switchingApps = nextRoot.dataset.desktopApp !== root.dataset.desktopApp;
  const motion = motionByNavigation.get(navigation.signal);

  rememberScroll();
  saveHistoryScroll();
  pendingSwap = navigation;

  nextRoot.classList.add("js");
  nextRoot.classList.toggle("mobile-lite", matchMedia("(max-width: 768px)").matches);
  nextRoot.classList.toggle("is-embedded-window", window.self !== window.top || navigation.to.searchParams.get("embed") === "1");
  nextRoot.classList.toggle("desktop-floating-maximized", root.classList.contains("desktop-floating-maximized"));

  if (motion) {
    motion.swapping = true;
    if (supportsViewTransitions) {
      const finish = () => {
        clearTransitionNames(motion);
        delete root.dataset.workspaceReveal;
      };
      void navigation.viewTransition.finished.then(finish, finish);
      if (reducedMotion.matches) navigation.viewTransition.skipTransition();
    }
  }

  if (!currentFrame || !nextFrame || !currentMain || !nextMain) return;
  const currentRestore = document.querySelector<HTMLButtonElement>('[data-window-action="restore"]');
  const nextRestore = nextDoc.querySelector<HTMLButtonElement>('[data-window-action="restore"]');
  let closed = currentFrame.hidden;
  let minimized = currentFrame.classList.contains("is-minimized");
  let maximized = currentFrame.classList.contains("is-maximized");
  if (switchingApps) {
    closed = minimized = maximized = false;
    try {
      maximized = readHostWindowState(sessionStorage, nextRoot.dataset.desktopApp).maximized;
      sessionStorage.setItem(hostWindowStorageKey(nextRoot.dataset.desktopApp), JSON.stringify({ closed, minimized, maximized }));
    } catch {
      // Window state is optional when storage is unavailable.
    }
    nextFrame.hidden = closed;
    nextFrame.classList.toggle("is-minimized", minimized);
    nextFrame.classList.toggle("is-maximized", maximized);
  }
  nextRoot.classList.toggle("window-closed", closed);
  nextRoot.classList.toggle("window-minimized", !closed && minimized);
  nextRoot.classList.toggle("window-maximized", !closed && !minimized && maximized);

  // Keeping the host and the React dock connected also keeps their listeners,
  // window geometry, player state and any embedded browsing contexts alive.
  navigation.swap = () => {
    swapFunctions.deselectScripts(nextDoc);
    swapFunctions.swapRootAttributes(nextDoc);
    swapFunctions.swapHeadElements(nextDoc);
    if (switchingApps) {
      currentFrame.replaceWith(nextFrame);
      if (currentRestore && nextRestore) currentRestore.replaceWith(nextRestore);
    } else {
      currentMain.replaceWith(nextMain);
      syncSidebar(nextDoc);
      const label = currentFrame.querySelector(".mobile-page-label");
      const nextLabel = nextFrame.querySelector(".mobile-page-label");
      if (label && nextLabel) label.textContent = nextLabel.textContent;
    }
    // Preserve un-executed page scripts (e.g. Astro <script> modules emitted outside #main-content)
    // so Astro's runScripts() executes them on first client-side visit to the route.
    for (const script of Array.from(nextDoc.scripts)) {
      const type = script.getAttribute("type");
      const isExecutable = !type || type === "module" || type === "text/javascript";
      if (isExecutable && script.dataset.astroExec !== "" && !document.contains(script)) {
        document.body.append(script);
      }
    }
    syncPrefetchPolicy(document);
  };
});

document.addEventListener("astro:after-swap", () => {
  const navigation = pendingSwap;
  pendingSwap = undefined;
  activeIndex = history.state?.index ?? 0;
  activePage = location.pathname + location.search;
  if (!navigation) return;
  clearNavigationFeedback(navigation.signal);

  const target = hashTarget(location.hash);
  const traverse = navigation.navigationType === "traverse";
  if (!traverse || !restoreScroll(activeIndex)) {
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  const main = mainContent();
  if (!main) return;

  shuffleGearGrid(main);
  const autoFolders = Array.from(main.querySelectorAll<HTMLElement>(".gf-root[data-auto]"));
  const folderWidths = autoFolders.map((element) => element.clientWidth);
  autoFolders.forEach((element, index) => {
    const width = folderWidths[index];
    if (width > 0) element.style.setProperty("--gf-k", String(width / 340));
  });

  const motion = motionByNavigation.get(navigation.signal);
  if (motion?.mode === "page" && !reducedMotion.matches && !traverse && !target) {
    const groups = main.querySelectorAll<HTMLElement>("[data-motion-reveal]");
    if (groups.length > 0) {
      groups.forEach((element, index) => element.style.setProperty("--reveal-order", String(index)));
      root.dataset.workspaceReveal = "groups";
    } else if (motion.compact) {
      root.dataset.workspaceReveal = "compact";
    }
  }
  if (motion?.mode === "window" && motion.compact) getFrame(document)?.setAttribute("data-workspace-window-enter", "");
  if (motion?.matchingElement && motion.matchingName && isInsideScrollport(motion.matchingElement)) {
    nameForTransition(motion, motion.matchingElement, motion.matchingName);
  }
  if (!main.querySelector(".app-route-fallback")) {
    const focusTarget = target?.matches("[data-motion-focus]") ? target : main;
    focusTarget.focus({ preventScroll: true });
  }
  rememberScroll();
});

// Astro handles viewport scroll. Restore nested scrollports for same-page history as well.
window.addEventListener("popstate", () => {
  if (location.pathname + location.search !== activePage) return;
  rememberScroll();
  activeIndex = history.state?.index ?? activeIndex;
  if (!restoreScroll(activeIndex)) hashTarget(location.hash)?.scrollIntoView({ behavior: "instant" });
});
window.addEventListener("hashchange", () => {
  activeIndex = history.state?.index ?? activeIndex;
});
window.addEventListener("pagehide", () => {
  rememberScroll();
  saveHistoryScroll();
});
document.addEventListener("astro:page-load", () => {
  if (!positions.has(activeIndex)) {
    restoreScroll(activeIndex);
    rememberScroll();
  }
  while (positions.size > 80) {
    const oldest = positions.keys().next();
    if (oldest.done) break;
    positions.delete(oldest.value);
  }
});
