import { useState } from "react";

interface SpotifyArtworkProps {
  src?: string;
  alt: string;
  fallbackColor: string;
  fallbackText: string;
  className?: string;
}

export function SpotifyArtwork({
  src,
  alt,
  fallbackColor,
  fallbackText,
  className = "",
}: SpotifyArtworkProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          backgroundColor: fallbackColor,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "14px",
        }}
        aria-label={alt}
      >
        {fallbackText.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

