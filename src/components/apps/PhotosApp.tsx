import { useEffect, useMemo, useRef } from "react";

interface PhotosAppProps {
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
}

function buildEmbeddedPhotosSrc(initialUrl?: string): string {
  if (!initialUrl || !initialUrl.startsWith("/photos")) {
    return "/photos?embed=1";
  }
  try {
    const parsed = new URL(initialUrl, "https://loc.digital");
    parsed.searchParams.set("embed", "1");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/photos?embed=1";
  }
}

export function PhotosApp({ initialUrl, onUrlChange }: PhotosAppProps = {}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onUrlChangeRef = useRef(onUrlChange);
  onUrlChangeRef.current = onUrlChange;

  const initialSrc = useMemo(() => buildEmbeddedPhotosSrc(initialUrl), []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      const data = event.data as { type?: string; url?: string } | null;
      if (data?.type === "photos:url-change" && typeof data.url === "string" && data.url.startsWith("/photos")) {
        onUrlChangeRef.current?.(data.url);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={initialSrc}
      title="Photos — Photography"
      className="w-full h-full border-0 block bg-white"
      loading="eager"
    />
  );
}
