import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import type { PhotosWidgetPayload } from "@/lib/api/photos-feed";
import { fetchJsonDeduped } from "@/lib/cache/client-cache";

type WidgetDestination = PhotosWidgetPayload["destinations"][number];

interface PhotosDesktopWidgetProps {
  onOpen: () => void;
}

type WidgetTab = "library" | "collections";

interface MosaicTile {
  id: string;
  src: string;
  alt: string;
  favorite?: boolean;
}

export function PhotosDesktopWidget({ onOpen }: PhotosDesktopWidgetProps) {
  const [destinations, setDestinations] = useState<WidgetDestination[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [activeTab, setActiveTab] = useState<WidgetTab>("library");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchJsonDeduped<PhotosWidgetPayload>("/api/photos-widget.json").then((payload) => {
      if (!active || !payload) return;
      setDestinations(payload.destinations);
      setTotalPhotos(payload.totalPhotos);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedDestination = useMemo(
    () => destinations.find((d) => d.slug === selectedSlug) ?? null,
    [destinations, selectedSlug],
  );

  // Build 13 tiles for the iOS 26 asymmetric 7x3 bento mosaic:
  // [0]: 2x2 top-left hero
  // [1..5]: 5 top-right 1x1 tiles (row 1, cols 3-7)
  // [6..7]: 2 middle 1x1 tiles (row 2, cols 3-4)
  // [8]: 3x2 bottom-right hero (rows 2-3, cols 5-7)
  // [9..12]: 4 bottom-left 1x1 tiles (row 3, cols 1-4)
  const mosaicTiles = useMemo<MosaicTile[]>(() => {
    const pool: WidgetDestination["photos"] = [];
    if (selectedDestination) {
      pool.push(...selectedDestination.photos);
    } else {
      // Interleave photos across destinations for a rich, varied mosaic
      const maxLen = Math.max(0, ...destinations.map((d) => d.photos.length));
      for (let i = 0; i < maxLen && pool.length < 24; i++) {
        for (const dest of destinations) {
          if (dest.photos[i]) pool.push(dest.photos[i]);
        }
      }
    }

    if (pool.length === 0) return [];

    const tiles: MosaicTile[] = [];
    for (let i = 0; i < 13; i++) {
      const photo = pool[i % pool.length];
      tiles.push({
        id: `${photo.id}-${i}`,
        src: photo.src,
        alt: photo.alt,
        favorite: i === 6 || i === 9,
      });
    }
    return tiles;
  }, [destinations, selectedDestination]);

  const headerTitle = selectedDestination
    ? selectedDestination.name
    : destinations[0]?.name || "Golden Hour";

  const headerSubtitle = selectedDestination
    ? `${selectedDestination.region} · ${selectedDestination.photoCount}`
    : `Over the Years · ${totalPhotos || mosaicTiles.length}`;

  const handleOpenCollection = (slug: string | null) => {
    setSelectedSlug(slug);
    setActiveTab("library");
  };

  return (
    <div className="dw-card dw-card--photos">
      {activeTab === "library" ? (
        <div className="dw-ios-library">
          {/* Asymmetric 7x3 iOS 26 Bento Mosaic */}
          <div className="dw-ios-mosaic" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }} aria-label="Open Photos">
            {mosaicTiles.map((tile, idx) => (
              <div
                key={tile.id}
                className={`dw-ios-tile dw-ios-tile--${idx}`}
              >
                <img src={tile.src} alt={tile.alt} loading="lazy" decoding="async" />
                {tile.favorite && (
                  <span className="dw-ios-heart" aria-hidden="true">
                    <Heart size={10} fill="currentColor" strokeWidth={0} />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Top-left gradient + back & title overlay */}
          <div className="dw-ios-top-scrim" aria-hidden="true" />
          <div className="dw-ios-header">
            <button
              type="button"
              className="dw-ios-glass-circle"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("collections");
              }}
              aria-label="Back to Collections"
            >
              <ChevronLeft size={15} strokeWidth={2.4} />
            </button>
            <div className="dw-ios-header-text">
              <div className="dw-ios-title">{headerTitle}</div>
              <div className="dw-ios-subtitle">{headerSubtitle}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dw-ios-collections" data-widget-scroll>
          {/* Memories Section */}
          <div className="dw-ios-section">
            <button
              type="button"
              className="dw-ios-section-head"
              onClick={() => handleOpenCollection(null)}
            >
              <span>Memories</span>
              <ChevronRight size={13} strokeWidth={2.4} />
            </button>
            <div className="dw-ios-memories-row">
              {destinations.slice(0, 6).map((dest) => (
                <button
                  key={dest.slug}
                  type="button"
                  className="dw-ios-memory-card"
                  onClick={() => handleOpenCollection(dest.slug)}
                >
                  <img
                    src={dest.heroSrc || dest.previewImages?.[0]}
                    alt={dest.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="dw-ios-memory-scrim" />
                  <div className="dw-ios-memory-meta">
                    <span className="dw-ios-memory-title">{dest.name}</span>
                    <span className="dw-ios-memory-sub">{dest.region.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Albums Section */}
          <div className="dw-ios-section">
            <button
              type="button"
              className="dw-ios-section-head"
              onClick={onOpen}
            >
              <span>Albums</span>
              <ChevronRight size={13} strokeWidth={2.4} />
            </button>
            <div className="dw-ios-albums-row">
              {/* All Photos mini-mosaic card */}
              <button
                type="button"
                className="dw-ios-album-card dw-ios-album-card--recent"
                onClick={() => handleOpenCollection(null)}
              >
                <div className="dw-ios-mini-grid">
                  {destinations.slice(0, 4).map((d) => (
                    <img
                      key={d.slug}
                      src={d.heroSrc || d.previewImages?.[0]}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
                <div className="dw-ios-album-scrim" />
                <span className="dw-ios-album-title">Recently Saved</span>
              </button>

              {destinations.slice(0, 8).map((dest) => (
                <button
                  key={`album-${dest.slug}`}
                  type="button"
                  className="dw-ios-album-card"
                  onClick={() => handleOpenCollection(dest.slug)}
                >
                  <img
                    src={dest.previewImages?.[1] || dest.heroSrc}
                    alt={dest.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="dw-ios-album-scrim" />
                  <span className="dw-ios-album-title">{dest.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
