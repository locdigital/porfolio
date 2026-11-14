export type PageCleanup = () => void;
export type PageSetup = (signal: AbortSignal) => void | PageCleanup;

export function onPageLoad(setup: PageSetup) {
  let controller: AbortController | undefined;
  let cleanup: PageCleanup | void;

  const stop = () => {
    controller?.abort();
    controller = undefined;
    if (typeof cleanup === "function") {
      cleanup();
      cleanup = undefined;
    }
  };

  const start = () => {
    stop();
    controller = new AbortController();
    cleanup = setup(controller.signal);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  document.addEventListener("astro:page-load", start);
  document.addEventListener("astro:before-swap", stop);
}

