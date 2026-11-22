import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Folder,
  Grid,
  Search,
  X,
} from "lucide-react";
import type { PhotosApiDestination, PhotosApiPhoto } from "../../pages/api/photos.json";

interface PhotosPayload {
  destinationCount: number;
  totalPhotos: number;
  destinations: PhotosApiDestination[];
}

export function PhotosApp() {
  const [data, setData] = useState<PhotosPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"folders" | "all">("folders");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleAllCount, setVisibleAllCount] = useState(60);

  useEffect(() => {
    let active = true;
    fetch("/api/photos.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PhotosPayload>;
      })
      .then((payload) => {
        if (active) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load photography archive.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const regions = useMemo(() => {
    if (!data) return ["All"];
    const set = new Set(data.destinations.map((d) => d.region));
    return ["All", ...Array.from(set)];
  }, [data]);

  const filteredDestinations = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.destinations.filter((dest) => {
      const matchesRegion = regionFilter === "All" || dest.region === regionFilter;
      const matchesQuery =
        !q ||
        dest.name.toLowerCase().includes(q) ||
        dest.region.toLowerCase().includes(q) ||
        dest.headline.toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [data, query, regionFilter]);

  const activeDestination = useMemo(
    () => data?.destinations.find((d) => d.slug === selectedSlug) ?? null,
    [data, selectedSlug],
  );

  const allPhotos = useMemo<PhotosApiPhoto[]>(() => {
    if (!data) return [];
    return filteredDestinations.flatMap((d) => d.photos);
  }, [data, filteredDestinations]);

  const activeLightboxPhotos = activeDestination ? activeDestination.photos : allPhotos;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % activeLightboxPhotos.length,
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + activeLightboxPhotos.length) % activeLightboxPhotos.length,
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, activeLightboxPhotos.length]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-[#6e6e73]">
        Loading real photography archive…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-sm text-red-600">
        Could not load photography archive ({error ?? "unknown error"}).
      </div>
    );
  }

  const currentLightboxPhoto =
    lightboxIndex !== null ? activeLightboxPhotos[lightboxIndex] : null;

  return (
    <div className="min-h-full bg-white text-[#1d1d1f] p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-black/[0.07] pb-5">
        <div>
          {activeDestination ? (
            <button
              type="button"
              onClick={() => {
                setSelectedSlug(null);
                setLightboxIndex(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] bg-transparent border-0 p-0 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All {data.destinationCount} Destinations</span>
            </button>
          ) : (
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6e6e73] mb-1">
              {data.destinationCount} Destinations · {data.totalPhotos} Real Photographs
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] m-0">
            {activeDestination ? activeDestination.name : "Photography"}
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1 mb-0">
            {activeDestination
              ? `${activeDestination.photoCount} photos · ${activeDestination.region} — ${activeDestination.headline}`
              : "Shot on Leica Q3, Nikon Zf, or iPhone across Vietnam and Southeast Asia."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!activeDestination && (
            <>
              <div className="inline-flex rounded-lg bg-[#f5f5f7] p-0.5 border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setViewMode("folders")}
                  aria-pressed={viewMode === "folders"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${
                    viewMode === "folders"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Folders</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("all")}
                  aria-pressed={viewMode === "all"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${
                    viewMode === "all"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>All Photos ({allPhotos.length})</span>
                </button>
              </div>

              <label className="relative w-full sm:w-52">
                <Search
                  className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter destinations..."
                  aria-label="Filter destinations"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f5f5f7] border border-black/[0.08] rounded-lg text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-black/15 focus:bg-white transition"
                />
              </label>
            </>
          )}

          {activeDestination && (
            <a
              href={`/photos/${activeDestination.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-medium no-underline transition"
            >
              <span>Open Full Travel Journal</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {/* Region Filters */}
      {!activeDestination && (
        <div className="flex flex-wrap items-center gap-2 py-4" role="group" aria-label="Filter by region">
          {regions.map((region) => {
            const active = regionFilter === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => setRegionFilter(region)}
                aria-pressed={active}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                  active
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      )}

      {/* Folder Detail View */}
      {activeDestination ? (
        <div className="mt-6 columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {activeDestination.photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="block w-full break-inside-avoid rounded-xl overflow-hidden bg-[#f5f5f7] border border-black/[0.06] p-0 cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1d1f]"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.width || 800}
                height={photo.height || 600}
                loading={idx < 6 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>
      ) : viewMode === "folders" ? (
        /* 4-Column Glass Folder Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-2">
          {filteredDestinations.map((dest) => (
            <button
              key={dest.slug}
              type="button"
              onClick={() => setSelectedSlug(dest.slug)}
              className="group text-left bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d1d1f] rounded-2xl"
            >
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#f5f5f7] border border-black/[0.08] shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                {dest.heroSrc ? (
                  <img
                    src={dest.heroSrc}
                    alt={dest.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                {/* Frosted macOS folder front glass */}
                <div className="absolute inset-x-0 bottom-0 h-[44%] bg-white/75 backdrop-blur-md border-t border-white/80 px-3.5 py-2.5 flex flex-col justify-center">
                  <div className="text-sm font-semibold text-[#1d1d1f] truncate">
                    {dest.name}
                  </div>
                  <div className="text-[11px] text-[#6e6e73] mt-0.5">
                    {dest.photoCount} photos · {dest.region}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* All Photos Masonry View */
        <div className="mt-2">
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3.5 space-y-3.5">
            {allPhotos.slice(0, visibleAllCount).map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="block w-full break-inside-avoid rounded-xl overflow-hidden bg-[#f5f5f7] border border-black/[0.06] p-0 cursor-pointer group relative"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width || 600}
                  height={photo.height || 450}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="sr-only">
                  {photo.destinationName}: {photo.alt}
                </span>
              </button>
            ))}
          </div>

          {visibleAllCount < allPhotos.length && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisibleAllCount((c) => c + 60)}
                className="px-4 py-2 rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] text-xs font-medium text-[#1d1d1f] cursor-pointer transition"
              >
                Load more photos ({visibleAllCount} of {allPhotos.length} shown)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {currentLightboxPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={currentLightboxPhoto.title || currentLightboxPhoto.alt}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                (lightboxIndex - 1 + activeLightboxPhotos.length) % activeLightboxPhotos.length,
              );
            }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % activeLightboxPhotos.length);
            }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            className="max-w-5xl max-h-[82vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentLightboxPhoto.src}
              alt={currentLightboxPhoto.alt}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center text-white max-w-2xl">
              <div className="text-sm font-medium">
                {currentLightboxPhoto.title || currentLightboxPhoto.destinationName}
              </div>
              {(currentLightboxPhoto.story || currentLightboxPhoto.caption) && (
                <p className="text-xs text-white/75 mt-1 mb-0">
                  {currentLightboxPhoto.story || currentLightboxPhoto.caption}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/60">
                <span>
                  {lightboxIndex + 1} / {activeLightboxPhotos.length}
                </span>
                <span>{currentLightboxPhoto.location}</span>
                {currentLightboxPhoto.camera && (
                  <span className="inline-flex items-center gap-1">
                    <Camera className="w-3 h-3" aria-hidden="true" />
                    {currentLightboxPhoto.camera}
                    {currentLightboxPhoto.lens ? ` · ${currentLightboxPhoto.lens}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
