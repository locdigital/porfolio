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

  function openDrawer() {
    sidebar?.classList.add("is-open");
    backdrop?.classList.add("is-open");
    toggleBtn?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    sidebar?.classList.remove("is-open");
    backdrop?.classList.remove("is-open");
    toggleBtn?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggleBtn?.addEventListener("click", () => {
    const isOpen = sidebar?.classList.contains("is-open");
    if (isOpen) closeDrawer();
    else openDrawer();
  }, { signal });

  closeBtn?.addEventListener("click", closeDrawer, { signal });
  backdrop?.addEventListener("click", closeDrawer, { signal });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar?.classList.contains("is-open")) {
      closeDrawer();
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

