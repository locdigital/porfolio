import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AppId } from "../dock/dock.config";

interface EmbeddedRouteAppProps {
  appId: AppId;
  defaultRoute: string;
  title: string;
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
  onFocus?: () => void;
}

function buildEmbeddedSrc(defaultRoute: string, initialUrl?: string): string {
  const candidate = initialUrl && initialUrl.startsWith("/") ? initialUrl : defaultRoute;
  try {
    const parsed = new URL(candidate, "https://loc.digital");
    parsed.searchParams.set("embed", "1");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `${defaultRoute}${defaultRoute.includes("?") ? "&" : "?"}embed=1`;
  }
}

function readCleanIframeUrl(win: Window): string | null {
  try {
    const url = new URL(win.location.href);
    if (url.origin !== window.location.origin) return null;
    url.searchParams.delete("embed");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function EmbeddedRouteApp({
  appId,
  defaultRoute,
  title,
  initialUrl,
  onUrlChange,
  onFocus,
}: EmbeddedRouteAppProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onUrlChangeRef = useRef(onUrlChange);
  onUrlChangeRef.current = onUrlChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const initialSrc = useMemo(
    () => buildEmbeddedSrc(defaultRoute, initialUrl),
    // Keep iframe src stable after mount so internal navigation is preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultRoute],
  );

  const attachFrameListeners = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    const frame = iframeRef.current;
    const win = frame?.contentWindow;
    const doc = frame?.contentDocument;
    if (!win || !doc) return;

    const syncUrl = () => {
      const cleanUrl = readCleanIframeUrl(win);
      if (!cleanUrl) return;
      if (appId === "photos" && !cleanUrl.startsWith("/photos")) return;
      if (appId === "workspace" && cleanUrl.startsWith("/photos")) return;
      onUrlChangeRef.current?.(cleanUrl);
    };

    const handleFocus = () => {
      onFocusRef.current?.();
    };

    syncUrl();
    doc.addEventListener("pointerdown", handleFocus, true);
    doc.addEventListener("focusin", handleFocus, true);
    doc.addEventListener("astro:after-swap", syncUrl);
    win.addEventListener("hashchange", syncUrl);
    win.addEventListener("popstate", syncUrl);

    cleanupRef.current = () => {
      try {
        doc.removeEventListener("pointerdown", handleFocus, true);
        doc.removeEventListener("focusin", handleFocus, true);
        doc.removeEventListener("astro:after-swap", syncUrl);
        win.removeEventListener("hashchange", syncUrl);
        win.removeEventListener("popstate", syncUrl);
      } catch {}
    };
  }, [appId]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={initialSrc}
      title={title}
      className="w-full h-full border-0 block bg-white"
      loading="eager"
      onLoad={attachFrameListeners}
    />
  );
}

export default EmbeddedRouteApp;
