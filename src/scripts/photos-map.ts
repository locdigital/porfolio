import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  setWorkerUrl,
} from "maplibre-gl";

export interface MapDestination {
  slug: string;
  name: string;
  region: string;
  country: string;
  headline: string;
  photoCount: number;
  heroPhoto: string;
  pinThumb?: string;
  previewImages?: string[];
  lat: number;
  lng: number;
  search: string;
  albumSlug?: string;
  photoId?: string;
  photoLocations?: MapPhotoLocation[];
}

export interface MapPhotoLocation {
  id: string;
  src: string;
  alt: string;
  lat: number;
  lng: number;
}

export type MapMode = "map" | "grid";

export interface PhotosMapController {
  setVisible: (visible: boolean) => void;
  setMode: (mode: MapMode) => void;
  setFilteredSlugs: (slugs: Set<string> | null) => void;
  retry: () => void;
  destroy: () => void;
}

export type PhotosMapState = "loading" | "ready" | "error" | "empty";

export interface PinCluster {
  key: string;
  items: MapDestination[];
  lat: number;
  lng: number;
  totalPhotos: number;
  cover: MapDestination;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

interface PooledMarker {
  marker: MapLibreMarker;
  element: HTMLElement;
  cluster: PinCluster;
  lat: number;
  lng: number;
}

/** MapLibre GL uses [lng, lat] order. */
export const DEFAULT_CENTER: [number, number] = [106.2, 12.8];
/** MapLibre vector tiles are 512px (roughly Leaflet zoom - 1). */
export const DEFAULT_ZOOM = 4.6;
export const CLUSTER_RADIUS_PX = 76;
const ZOOM_RECLUSTER_THRESHOLD = 0.35;

/**
 * OpenFreeMap Positron: free OpenMapTiles/OpenStreetMap vector basemap with no
 * API key or billing account. Keep this URL stable because it is also the
 * production smoke-test target for style and vector-tile loading.
 */
export const STANDARD_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** OpenFreeMap's dark companion style for system dark mode. */
export const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function serializeSlugs(slugs: Set<string> | null): string {
  if (!slugs) return "*";
  return Array.from(slugs).sort().join(",");
}

export function clusterDestinations(
  items: MapDestination[],
  project: (lngLat: [number, number]) => ProjectedPoint,
  radiusPx = CLUSTER_RADIUS_PX,
): PinCluster[] {
  const sorted = [...items].sort((a, b) => b.photoCount - a.photoCount);
  const points = sorted.map((item) => ({
    item,
    pt: project([item.lng, item.lat]),
  }));

  const used = new Set<number>();
  const clusters: PinCluster[] = [];
  const radiusSq = radiusPx * radiusPx;

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const group = [points[i].item];
    let sumLat = points[i].item.lat;
    let sumLng = points[i].item.lng;

    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      const dx = points[i].pt.x - points[j].pt.x;
      const dy = points[i].pt.y - points[j].pt.y;
      if (dx * dx + dy * dy < radiusSq) {
        used.add(j);
        group.push(points[j].item);
        sumLat += points[j].item.lat;
        sumLng += points[j].item.lng;
      }
    }

    const totalPhotos = group.reduce((sum, d) => sum + d.photoCount, 0);
    const slugKey = group
      .map((d) => d.slug)
      .sort()
      .join(",");

    clusters.push({
      key: `${group[0].slug}|${slugKey}|${totalPhotos}`,
      items: group,
      lat: sumLat / group.length,
      lng: sumLng / group.length,
      totalPhotos,
      cover: group[0],
    });
  }

  return clusters;
}

export function computeBoundsTuple(
  items: Pick<MapDestination, "lat" | "lng">[],
): [[number, number], [number, number]] | null {
  if (items.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const item of items) {
    if (item.lng < minLng) minLng = item.lng;
    if (item.lat < minLat) minLat = item.lat;
    if (item.lng > maxLng) maxLng = item.lng;
    if (item.lat > maxLat) maxLat = item.lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function createPhotosMap(options: {
  container: HTMLElement;
  destinations: MapDestination[];
  basePath?: string;
  onVisibleSlugsChange?: (slugs: string[]) => void;
  onStateChange?: (state: PhotosMapState, message?: string) => void;
  signal: AbortSignal;
}): PhotosMapController {
  const {
    container,
    destinations,
    basePath = "/photos",
    onVisibleSlugsChange,
    onStateChange,
    signal,
  } = options;
  const numberLocale = "en-US";
  const copy = {
    loading: "Loading map…",
    empty: "No photo locations are available yet.",
    webglFallback: "Interactive map requires WebGL support in your browser.",
    timeoutError: "The basemap took too long to load. Check your connection and try again.",
    loadError: "The OpenFreeMap basemap could not be loaded. Check your connection and try again.",
    photosLabel: "Photos",
    photosUnitAria: "photos",
  };

  let map: MapLibreMap | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeRaf: number | null = null;
  let clusterRaf: number | null = null;
  let lastSizeW = 0;
  let lastSizeH = 0;
  let lastClusterZoom = Number.NaN;
  let currentMode: MapMode = "map";
  let styleErrorCount = 0;
  let styleLoadTimer: number | null = null;
  let initialBoundsFitted = false;
  let styleReady = false;
  let filteredSlugs: Set<string> | null = null;
  let lastFilterKey = "*";
  let isVisible = false;
  let activePopupSlug: string | null = null;

  const markerPool = new Map<string, PooledMarker>();

  const canvasEl = container.querySelector<HTMLElement>("#mp-map-canvas");
  const zoomInBtn = container.querySelector<HTMLButtonElement>("#mp-map-zoom-in");
  const zoomOutBtn = container.querySelector<HTMLButtonElement>("#mp-map-zoom-out");
  const compassBtn = container.querySelector<HTMLButtonElement>("#mp-map-compass");
  const compassSvg = compassBtn?.querySelector<SVGSVGElement>("svg") ?? null;
  const cardEl = container.querySelector<HTMLElement>("#mp-map-card");
  const cardCloseBtn = container.querySelector<HTMLButtonElement>("#mp-map-card-close");

  const getActiveDestinations = () =>
    filteredSlugs ? destinations.filter((d) => filteredSlugs!.has(d.slug)) : destinations;

  const setState = (state: PhotosMapState, message?: string) => {
    onStateChange?.(state, message);
  };

  const isDarkMode = () =>
    document.documentElement.dataset.theme === "dark" ||
    (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const standardStyle = () => (isDarkMode() ? DARK_STYLE_URL : STANDARD_STYLE_URL);

  const hideCard = () => {
    activePopupSlug = null;
    if (cardEl) cardEl.hidden = true;
  };

  const showCard = (dest: MapDestination) => {
    if (!cardEl) return;
    activePopupSlug = dest.slug;
    const imgEl = cardEl.querySelector<HTMLImageElement>("[data-card-img]");
    const titleEl = cardEl.querySelector<HTMLElement>("[data-card-title]");
    const metaEl = cardEl.querySelector<HTMLElement>("[data-card-meta]");
    const headlineEl = cardEl.querySelector<HTMLElement>("[data-card-headline]");
    const linkEl = cardEl.querySelector<HTMLAnchorElement>("[data-card-link]");

    if (imgEl) {
      imgEl.src = dest.heroPhoto || dest.pinThumb || "";
      imgEl.alt = dest.name;
    }
    if (titleEl) titleEl.textContent = dest.name;
    if (metaEl) metaEl.textContent = `${dest.photoCount.toLocaleString(numberLocale)} ${copy.photosLabel} · ${dest.country}`;
    if (headlineEl) headlineEl.textContent = dest.headline || "";
    if (linkEl) linkEl.href = `${basePath}/${dest.albumSlug || dest.slug}`;
    cardEl.hidden = false;
  };

  const syncCompass = () => {
    if (!compassSvg || !map) return;
    const bearing = map.getBearing();
    compassSvg.style.transform = Math.abs(bearing) < 0.25 ? "" : `rotate(${-bearing}deg)`;
  };

  const notifyVisibleSlugs = () => {
    if (!map || !onVisibleSlugsChange) return;
    const bounds = map.getBounds();
    const active = getActiveDestinations();
    const inBounds = active
      .filter((d) => bounds.contains([d.lng, d.lat]))
      .map((d) => d.slug);
    onVisibleSlugsChange(inBounds.length > 0 ? inBounds : active.map((d) => d.slug));
  };

  const flyToDestinations = (items: MapDestination[], maxZoom: number, duration = 520) => {
    if (!map || items.length === 0) return;
    if (items.length === 1) {
      const target = items[0];
      map.flyTo({
        center: [target.lng, target.lat],
        zoom: Math.max(map.getZoom(), Math.min(maxZoom, 8.5)),
        duration,
        essential: true,
      });
      return;
    }

    const tuple = computeBoundsTuple(items);
    if (!tuple) return;
    const bounds = new LngLatBounds(tuple[0], tuple[1]);
    map.fitBounds(bounds, {
      padding: 92,
      maxZoom,
      duration,
      essential: true,
    });
  };

  const fitInitialBounds = () => {
    if (!map || initialBoundsFitted) return;
    const active = getActiveDestinations();
    if (active.length === 0) {
      setState("empty", copy.empty);
      return;
    }
    initialBoundsFitted = true;
    flyToDestinations(active, 7.5, 0);
  };

  const photoMarkerDestinations = (items: MapDestination[]): MapDestination[] =>
    items.flatMap((destination) => {
      const photos = destination.photoLocations ?? [];
      if (photos.length === 0) return [destination];
      return photos.map((photo) => ({
        ...destination,
        slug: `${destination.slug}#${photo.id}`,
        albumSlug: destination.slug,
        photoId: photo.id,
        name: photo.alt || destination.name,
        photoCount: 1,
        heroPhoto: photo.src,
        pinThumb: photo.src,
        lat: photo.lat,
        lng: photo.lng,
      }));
    });

  const createClusterMarker = (cluster: PinCluster): PooledMarker => {
    const countText = cluster.totalPhotos.toLocaleString(numberLocale);
    const labelText =
      cluster.items.length === 1
        ? cluster.cover.name
        : `${cluster.cover.name} +${cluster.items.length - 1}`;
    const thumbSrc = cluster.cover.pinThumb || cluster.cover.heroPhoto;

    const wrapper = document.createElement("div");
    wrapper.className = "mp-pin-wrapper";
    wrapper.innerHTML = `
      <div class="mp-pin" role="button" tabindex="0" aria-label="${escapeHtml(labelText)} (${escapeHtml(countText)} ${copy.photosUnitAria})" data-count="${cluster.items.length}">
        <div class="mp-pin-tooltip">${escapeHtml(labelText)}</div>
        <div class="mp-pin-frame">
          <img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(cluster.cover.name)}" width="60" height="60" loading="lazy" decoding="async" />
          <span class="mp-pin-count">${escapeHtml(countText)}</span>
        </div>
        <div class="mp-pin-tip"></div>
      </div>
    `;

    const marker = new MapLibreMarker({
      element: wrapper,
      anchor: "bottom",
    })
      .setLngLat([cluster.lng, cluster.lat])
      .addTo(map!);

    const entry: PooledMarker = {
      marker,
      element: wrapper,
      cluster,
      lat: cluster.lat,
      lng: cluster.lng,
    };

    const handleActivate = (e: Event) => {
      e.stopPropagation();
      const current = entry.cluster;
      if (current.items.length > 1 && map) {
        hideCard();
        const nextZoom = Math.min(map.getZoom() + 2.2, 11);
        flyToDestinations(current.items, nextZoom, 520);
      } else {
        showCard(current.cover);
      }
    };

    const pinEl = wrapper.querySelector<HTMLElement>(".mp-pin");
    pinEl?.addEventListener("click", handleActivate, { signal });
    pinEl?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate(e);
        }
      },
      { signal },
    );

    return entry;
  };

  const renderClusters = () => {
    if (!map) return;

    lastClusterZoom = map.getZoom();
    const active = getActiveDestinations();
    const clusterItems = map.getZoom() >= 8.5 ? photoMarkerDestinations(active) : active;
    const clusters = clusterDestinations(clusterItems, (lngLat) => map!.project(lngLat));
    const nextKeys = new Set<string>();

    for (const cluster of clusters) {
      nextKeys.add(cluster.key);
      const existing = markerPool.get(cluster.key);
      if (existing) {
        existing.cluster = cluster;
        if (
          Math.abs(existing.lat - cluster.lat) > 1e-6 ||
          Math.abs(existing.lng - cluster.lng) > 1e-6
        ) {
          existing.lat = cluster.lat;
          existing.lng = cluster.lng;
          existing.marker.setLngLat([cluster.lng, cluster.lat]);
        }
      } else {
        markerPool.set(cluster.key, createClusterMarker(cluster));
      }
    }

    for (const [key, pooled] of markerPool.entries()) {
      if (!nextKeys.has(key)) {
        pooled.marker.remove();
        markerPool.delete(key);
      }
    }

    notifyVisibleSlugs();
  };

  const scheduleClusters = () => {
    if (clusterRaf !== null) return;
    clusterRaf = requestAnimationFrame(() => {
      clusterRaf = null;
      if (isVisible && map) renderClusters();
    });
  };

  const applyMapStyle = () => {
    if (!map) return;
    styleErrorCount = 0;
    styleReady = false;
    map.setStyle(standardStyle(), { diff: false });
  };

  const themeMediaQuery =
    typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  themeMediaQuery?.addEventListener("change", () => {
    if (currentMode === "map" && map) applyMapStyle();
  }, { signal });

  const ensureInitialized = () => {
    if (map || !canvasEl) return;

    const initialStyle = standardStyle();

    try {
      if (maplibreWorkerUrl) {
        setWorkerUrl(maplibreWorkerUrl);
      }
      setState("loading", copy.loading);
      map = new MapLibreMap({
        container: canvasEl,
        style: initialStyle,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
        renderWorldCopies: true,
        dragRotate: true,
        pitchWithRotate: false,
        fadeDuration: 180,
        maxTileCacheSize: 120,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch (err) {
      console.error("[photos-map] WebGL initialization failed:", err);
      canvasEl.innerHTML =
        `<div class="mp-map-fallback">${escapeHtml(copy.webglFallback)}</div>`;
      setState("error", copy.webglFallback);
      return;
    }

    styleLoadTimer = window.setTimeout(() => {
      if (!styleReady) {
        console.error("[photos-map] OpenFreeMap style did not finish loading within 15 seconds.");
        setState("error", copy.timeoutError);
      }
    }, 15_000);

    const handleStyleReady = () => {
      styleReady = true;
      styleErrorCount = 0;
      if (styleLoadTimer !== null) {
        window.clearTimeout(styleLoadTimer);
        styleLoadTimer = null;
      }
      setState("ready");
      fitInitialBounds();
      renderClusters();
    };

    map.on("style.load", handleStyleReady);

    map.on("error", (ev) => {
      console.error("[photos-map] MapLibre style/tile error:", ev.error);
      const status = (ev?.error as { status?: number } | undefined)?.status;
      if (!styleReady || (status && status >= 400 && !map?.isStyleLoaded())) {
        styleErrorCount += 1;
        if (styleErrorCount >= 2) {
          setState("error", copy.loadError);
        }
      }
    });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        if (!isVisible || !map) return;
        const rect = entries[0]?.contentRect;
        if (!rect) return;
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w === lastSizeW && h === lastSizeH) return;
        lastSizeW = w;
        lastSizeH = h;
        if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          resizeRaf = null;
          if (!isVisible || !map) return;
          map.resize();
          renderClusters();
        });
      });
      resizeObserver.observe(container);
    }

    const resizeMap = () => {
      if (!isVisible || !map) return;
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        if (!isVisible || !map) return;
        map.resize();
        renderClusters();
      });
    };
    window.addEventListener("resize", resizeMap, { signal });
    window.visualViewport?.addEventListener("resize", resizeMap, { signal });

    // Re-cluster progressively during smooth continuous zoom and snap cleanly on zoomend.
    map.on("zoom", () => {
      if (!map) return;
      if (Math.abs(map.getZoom() - lastClusterZoom) >= ZOOM_RECLUSTER_THRESHOLD) {
        scheduleClusters();
      }
    });

    map.on("zoomend", () => {
      renderClusters();
    });

    map.on("rotate", () => {
      syncCompass();
    });

    map.on("moveend", () => {
      notifyVisibleSlugs();
    });

    map.on("click", (e) => {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target?.closest(".mp-pin")) return;
      hideCard();
    });

    if (destinations.length === 0) setState("empty", copy.empty);
    renderClusters();
    syncCompass();
  };

  const retry = () => {
    styleReady = false;
    styleErrorCount = 0;
    setState("loading", copy.loading);
    if (!map) {
      ensureInitialized();
      return;
    }
    if (styleLoadTimer !== null) window.clearTimeout(styleLoadTimer);
    styleLoadTimer = window.setTimeout(() => {
      if (!styleReady) setState("error", copy.loadError);
    }, 15_000);
    map.setStyle(standardStyle(), { diff: false });
  };

  zoomInBtn?.addEventListener("click", () => map?.zoomIn({ duration: 280 }), { signal });
  zoomOutBtn?.addEventListener("click", () => map?.zoomOut({ duration: 280 }), { signal });
  compassBtn?.addEventListener(
    "click",
    () => {
      hideCard();
      map?.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 600,
        essential: true,
      });
    },
    { signal },
  );
  cardCloseBtn?.addEventListener("click", hideCard, { signal });

  return {
    setVisible(visible: boolean) {
      if (isVisible === visible && (visible ? Boolean(map) : true)) return;
      isVisible = visible;
      if (visible) {
        ensureInitialized();
        requestAnimationFrame(() => {
          if (!map || !isVisible) return;
          map.resize();
          renderClusters();
        });
      } else {
        hideCard();
      }
    },
    setMode(mode: MapMode) {
      if (currentMode === mode) return;
      currentMode = mode;
      if (mode !== "grid") {
        applyMapStyle();
        if (isVisible && map) {
          requestAnimationFrame(() => {
            map?.resize();
            renderClusters();
          });
        }
      }
    },
    setFilteredSlugs(slugs: Set<string> | null) {
      const nextKey = serializeSlugs(slugs);
      if (nextKey === lastFilterKey) return;
      lastFilterKey = nextKey;
      filteredSlugs = slugs;
      if (activePopupSlug && slugs && !slugs.has(activePopupSlug)) {
        hideCard();
      }
      if (isVisible && map) {
        renderClusters();
        const active = getActiveDestinations();
        if (slugs && active.length > 0 && active.length <= 4) {
          flyToDestinations(active, 7.5, 520);
        }
      }
    },
    retry,
    destroy() {
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = null;
      }
      if (clusterRaf !== null) {
        cancelAnimationFrame(clusterRaf);
        clusterRaf = null;
      }
      if (styleLoadTimer !== null) {
        window.clearTimeout(styleLoadTimer);
        styleLoadTimer = null;
      }
      resizeObserver?.disconnect();
      resizeObserver = null;
      for (const pooled of markerPool.values()) {
        pooled.marker.remove();
      }
      markerPool.clear();
      map?.remove();
      map = null;
      if (compassSvg) compassSvg.style.transform = "";
    },
  };
}
