/**
 * On-demand stylesheets for lazily opened apps.
 *
 * App CSS is imported as `?url` so Astro does not hoist it into every page head.
 * Two details keep it working with the ClientRouter:
 *  - Links are appended at the end of <head>, after the page bundle, so app rules keep
 *    winning over Tailwind utilities exactly as they did when bundled.
 *  - Astro's head swap removes stylesheets the next page does not declare. Links this
 *    module owns are copied into the incoming document on `astro:before-swap`, so the
 *    swap treats them as shared and keeps the live element (no flash of unstyled app).
 */
const owned = new Set<string>();
const pending = new Map<string, Promise<void>>();
let swapHookInstalled = false;

function findStylesheet(root: ParentNode, href: string): HTMLLinkElement | undefined {
  return Array.from(root.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).find(
    (link) => link.getAttribute("href") === href,
  );
}

function appendStylesheet(doc: Document, href: string): HTMLLinkElement {
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  doc.head.appendChild(link);
  return link;
}

function whenApplied(link: HTMLLinkElement): Promise<void> {
  if (link.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    // Resolve on error as well: unstyled content beats a window that never opens.
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => resolve(), { once: true });
  });
}

function installSwapHook() {
  if (swapHookInstalled) return;
  swapHookInstalled = true;
  document.addEventListener("astro:before-swap", (event) => {
    const incoming = (event as Event & { newDocument?: Document }).newDocument;
    if (!incoming) return;
    for (const href of owned) {
      if (!findStylesheet(incoming.head, href)) appendStylesheet(incoming, href);
    }
  });
}

export function loadStylesheet(href: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  installSwapHook();
  owned.add(href);

  const inHead = findStylesheet(document.head, href);
  if (inHead) return whenApplied(inHead);

  const cached = pending.get(href);
  if (cached) return cached;

  // A server-rendered app route links its CSS in <body>; mirror it into <head> so it
  // survives client-side navigation, and reuse whichever copy finishes first.
  const fromBody = findStylesheet(document.body, href);
  const link = appendStylesheet(document, href);
  const promise = fromBody?.sheet ? Promise.resolve() : whenApplied(link);
  pending.set(href, promise);
  promise.finally(() => pending.delete(href));
  return promise;
}
