import { onPageLoad } from "./page-lifecycle";
import "./workspace-navigation";

const root = document.documentElement;
root.classList.add("js");

let revealObserver: IntersectionObserver | undefined;

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

function setupScrollReveals() {
  revealObserver?.disconnect();

  const elements = Array.from(document.querySelectorAll<HTMLElement>(".r, .toki-r, .reveal, .dash-reveal"));
  if (!elements.length) return;

  const reveal = (element: Element) => element.classList.add("in", "is-in");
  const mobileLite = window.matchMedia("(max-width: 768px)").matches;

  if (mobileLite || !("IntersectionObserver" in window)) {
    elements.forEach(reveal);
    return;
  }

  const isInInitialViewport = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight + 72 && rect.bottom > -72;
  };

  elements.forEach((element) => {
    if (isInInitialViewport(element)) reveal(element);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.06,
    rootMargin: "0px 0px -36px 0px",
  });

  elements.forEach((element) => {
    if (!element.classList.contains("in") && !element.classList.contains("is-in")) {
      observer.observe(element);
    }
  });

  revealObserver = observer;
}

onPageLoad((signal) => {
  root.classList.add("js");
  try {
    localStorage.removeItem("bgm-state");
  } catch {}
  setupMobileDrawer(signal);
  setupScrollReveals();

  return () => {
    revealObserver?.disconnect();
    document.body.style.overflow = "";
  };
});

window.addEventListener("pageshow", () => {
  setupScrollReveals();
});

