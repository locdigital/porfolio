export interface TocHeadingPosition {
  id: string;
  /** Top coordinate relative to the active scroll container's top edge. */
  relativeTop: number;
}

export interface TocScrollMetrics {
  scrollTop: number;
  maxScroll: number;
  containerHeight: number;
}

export function resolveActiveTocId(
  items: TocHeadingPosition[],
  metrics: TocScrollMetrics,
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0].id;

  const { scrollTop, maxScroll, containerHeight } = metrics;

  if (scrollTop <= 8) {
    return items[0].id;
  }

  if (maxScroll > 0 && scrollTop >= maxScroll - 20) {
    return items[items.length - 1].id;
  }

  const baseOffset = Math.min(200, containerHeight * 0.28);
  const remaining = Math.max(0, maxScroll - scrollTop);
  const bottomZone = Math.min(containerHeight * 0.65, Math.max(0, maxScroll * 0.45));
  let triggerOffset = baseOffset;

  if (bottomZone > 0 && remaining < bottomZone) {
    const progress = 1 - remaining / bottomZone;
    const maxOffset = Math.max(baseOffset, containerHeight * 0.72);
    triggerOffset = baseOffset + progress * (maxOffset - baseOffset);
  }

  let activeId = items[0].id;
  for (const item of items) {
    if (item.relativeTop <= triggerOffset) {
      activeId = item.id;
    } else {
      break;
    }
  }

  return activeId;
}

export interface InitTocSpyOptions {
  tocSelector: string;
  signal: AbortSignal;
}

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

export function initTocSpy({ tocSelector, signal }: InitTocSpyOptions): void {
  const toc = document.querySelector<HTMLElement>(tocSelector);
  if (!toc) return;

  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"));
  if (links.length === 0) return;

  const linkById = new Map(links.map((link) => [link.dataset.tocLink ?? "", link]));
  const targets = links
    .map((link) => {
      const id = link.dataset.tocLink ?? "";
      const el = id ? document.getElementById(id) : null;
      return el ? { id, el } : null;
    })
    .filter((entry): entry is { id: string; el: HTMLElement } => Boolean(entry));

  if (targets.length === 0) return;

  let currentId = "";
  let clickLocked = false;

  const setActive = (id: string, scrollLinkIntoView = false) => {
    if (!id || id === currentId) return;
    currentId = id;
    links.forEach((link) => {
      const active = link.dataset.tocLink === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
        if (scrollLinkIntoView) {
          link.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const mainScroll = document.getElementById("main-content");

  const isMainScrollActive = () => {
    if (!mainScroll) return false;
    const style = getComputedStyle(mainScroll);
    const scrollableStyle = style.overflowY === "auto" || style.overflowY === "scroll";
    return scrollableStyle && mainScroll.scrollHeight > mainScroll.clientHeight + 1;
  };

  const getScrollMetrics = (): {
    useMain: boolean;
    containerTop: number;
    metrics: TocScrollMetrics;
  } => {
    if (isMainScrollActive() && mainScroll) {
      return {
        useMain: true,
        containerTop: mainScroll.getBoundingClientRect().top,
        metrics: {
          scrollTop: mainScroll.scrollTop,
          maxScroll: Math.max(0, mainScroll.scrollHeight - mainScroll.clientHeight),
          containerHeight: mainScroll.clientHeight,
        },
      };
    }

    const docEl = document.documentElement;
    return {
      useMain: false,
      containerTop: 0,
      metrics: {
        scrollTop: window.scrollY || docEl.scrollTop,
        maxScroll: Math.max(0, docEl.scrollHeight - window.innerHeight),
        containerHeight: window.innerHeight,
      },
    };
  };

  const computeActiveHeading = (scrollLinkIntoView = true) => {
    if (clickLocked) return;

    const { containerTop, metrics } = getScrollMetrics();
    const positions: TocHeadingPosition[] = targets.map(({ id, el }) => ({
      id,
      relativeTop: el.getBoundingClientRect().top - containerTop,
    }));

    const activeId = resolveActiveTocId(positions, metrics);
    if (activeId) {
      setActive(activeId, scrollLinkIntoView);
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      computeActiveHeading(true);
    });
  };

  const unlockOnUserScroll = () => {
    if (!clickLocked) return;
    clickLocked = false;
  };

  const scrollToTarget = (el: HTMLElement) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    const marginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop || "0") || 24;

    if (isMainScrollActive() && mainScroll) {
      const targetTop =
        mainScroll.scrollTop +
        (el.getBoundingClientRect().top - mainScroll.getBoundingClientRect().top) -
        marginTop;
      mainScroll.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      });
    } else {
      const targetTop = window.scrollY + el.getBoundingClientRect().top - marginTop;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      });
    }
  };

  const initialHash = (() => {
    try {
      return decodeURIComponent(window.location.hash.replace(/^#/, ""));
    } catch {
      return "";
    }
  })();

  if (initialHash && linkById.has(initialHash)) {
    setActive(initialHash, false);
  } else {
    computeActiveHeading(false);
  }

  links.forEach((link) => {
    link.addEventListener(
      "click",
      (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        const id = link.dataset.tocLink;
        if (!id) return;
        const targetEl = document.getElementById(id);
        if (!targetEl) return;

        event.preventDefault();
        clickLocked = true;
        setActive(id, false);
        scrollToTarget(targetEl);

        try {
          window.history.replaceState(window.history.state, "", `#${encodeURIComponent(id)}`);
        } catch {
          // Ignore history errors in restricted contexts
        }
      },
      { signal },
    );
  });

  window.addEventListener("wheel", unlockOnUserScroll, { signal, passive: true });
  window.addEventListener("touchmove", unlockOnUserScroll, { signal, passive: true });
  mainScroll?.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target instanceof Node && toc.contains(event.target)) return;
      unlockOnUserScroll();
    },
    { signal, passive: true },
  );
  window.addEventListener(
    "keydown",
    (event) => {
      if (SCROLL_KEYS.has(event.key)) {
        unlockOnUserScroll();
      }
    },
    { signal },
  );

  window.addEventListener(
    "hashchange",
    () => {
      try {
        const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        if (hash && linkById.has(hash)) {
          setActive(hash, false);
        }
      } catch {
        // Ignore malformed hashes
      }
    },
    { signal },
  );

  mainScroll?.addEventListener("scroll", onScroll, { signal, passive: true });
  window.addEventListener("scroll", onScroll, { signal, passive: true });
  window.addEventListener("resize", onScroll, { signal, passive: true });
}
