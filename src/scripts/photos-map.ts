import "leaflet/dist/leaflet.css";
import L from "leaflet";

export interface MapDestination {
  slug: string;
  name: string;
  region: string;
  country: string;
  headline: string;
  photoCount: number;
  heroPhoto: string;
  previewImages: string[];
  lat: number;
  lng: number;
  search: string;
}

export type MapMode = "map" | "satellite" | "grid";

export interface PhotosMapController {
  setVisible: (visible: boolean) => void;
  setMode: (mode: MapMode) => void;
  setFilteredSlugs: (slugs: Set<string> | null) => void;
  destroy: () => void;
}

interface PinCluster {
  items: MapDestination[];
  lat: number;
  lng: number;
  totalPhotos: number;
  cover: MapDestination;
}

const DEFAULT_CENTER: [number, number] = [12.8, 106.2];
const DEFAULT_ZOOM = 5;
const CLUSTER_RADIUS_PX = 76;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createPhotosMap(options: {
  container: HTMLElement;
  destinations: MapDestination[];
  onVisibleSlugsChange?: (slugs: string[]) => void;
  signal: AbortSignal;
}): PhotosMapController {
  const { container, destinations, onVisibleSlugsChange, signal } = options;

  let map: L.Map | null = null;
  let markersLayer: L.LayerGroup | null = null;
  let standardLayer: L.TileLayer | null = null;
  let satelliteLayer: L.TileLayer | null = null;
  let satelliteLabelsLayer: L.TileLayer | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let currentMode: MapMode = "satellite";
  let filteredSlugs: Set<string> | null = null;
  let isVisible = false;
  let activePopupSlug: string | null = null;

  const canvasEl = container.querySelector<HTMLElement>("#mp-map-canvas");
  const zoomInBtn = container.querySelector<HTMLButtonElement>("#mp-map-zoom-in");
  const zoomOutBtn = container.querySelector<HTMLButtonElement>("#mp-map-zoom-out");
  const compassBtn = container.querySelector<HTMLButtonElement>("#mp-map-compass");
  const cardEl = container.querySelector<HTMLElement>("#mp-map-card");
  const cardCloseBtn = container.querySelector<HTMLButtonElement>("#mp-map-card-close");

  const getActiveDestinations = () =>
    filteredSlugs ? destinations.filter((d) => filteredSlugs!.has(d.slug)) : destinations;

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
      imgEl.src = dest.heroPhoto;
      imgEl.alt = dest.name;
    }
    if (titleEl) titleEl.textContent = dest.name;
    if (metaEl) {
      metaEl.textContent = `${dest.photoCount.toLocaleString()} Photos · ${dest.country}`;
    }
    if (headlineEl) headlineEl.textContent = dest.headline || "";
    if (linkEl) linkEl.href = `/photos/${dest.slug}`;
    cardEl.hidden = false;
  };

  const notifyVisibleSlugs = () => {
    if (!map || !onVisibleSlugsChange) return;
    const bounds = map.getBounds();
    const active = getActiveDestinations();
    const inBounds = active
      .filter((d) => bounds.contains([d.lat, d.lng]))
      .map((d) => d.slug);
    onVisibleSlugsChange(inBounds.length > 0 ? inBounds : active.map((d) => d.slug));
  };

  const buildClusters = (items: MapDestination[]): PinCluster[] => {
    if (!map) return [];
    const sorted = [...items].sort((a, b) => b.photoCount - a.photoCount);
    const points = sorted.map((item) => ({
      item,
      pt: map!.latLngToLayerPoint([item.lat, item.lng]),
    }));

    const used = new Set<number>();
    const clusters: PinCluster[] = [];

    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      used.add(i);
      const group = [points[i].item];
      let sumLat = points[i].item.lat;
      let sumLng = points[i].item.lng;

      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue;
        const dist = points[i].pt.distanceTo(points[j].pt);
        if (dist < CLUSTER_RADIUS_PX) {
          used.add(j);
          group.push(points[j].item);
          sumLat += points[j].item.lat;
          sumLng += points[j].item.lng;
        }
      }

      const totalPhotos = group.reduce((sum, d) => sum + d.photoCount, 0);
      clusters.push({
        items: group,
        lat: sumLat / group.length,
        lng: sumLng / group.length,
        totalPhotos,
        cover: group[0],
      });
    }

    return clusters;
  };

  const renderClusters = () => {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    const active = getActiveDestinations();
    const clusters = buildClusters(active);

    clusters.forEach((cluster) => {
      const countText = cluster.totalPhotos.toLocaleString();
      const labelText =
        cluster.items.length === 1
          ? cluster.cover.name
          : `${cluster.cover.name} +${cluster.items.length - 1}`;

      const iconHtml = `
        <div class="mp-pin" data-count="${cluster.items.length}">
          <div class="mp-pin-tooltip">${escapeHtml(labelText)}</div>
          <div class="mp-pin-frame">
            <img src="${escapeHtml(cluster.cover.heroPhoto)}" alt="${escapeHtml(cluster.cover.name)}" loading="lazy" decoding="async" />
            <span class="mp-pin-count">${escapeHtml(countText)}</span>
          </div>
          <div class="mp-pin-tip"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: "mp-pin-wrapper",
        html: iconHtml,
        iconSize: [64, 72],
        iconAnchor: [32, 72],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (cluster.items.length > 1 && map) {
          hideCard();
          const bounds = L.latLngBounds(cluster.items.map((d) => [d.lat, d.lng] as [number, number]));
          const nextZoom = Math.min(map.getZoom() + 2, 11);
          map.flyToBounds(bounds, { padding: [90, 90], maxZoom: nextZoom, duration: 0.55 });
        } else {
          showCard(cluster.cover);
        }
      });

      marker.addTo(markersLayer!);
    });

    notifyVisibleSlugs();
  };

  const applyTileMode = () => {
    if (!map || !standardLayer || !satelliteLayer || !satelliteLabelsLayer) return;
    if (currentMode === "satellite") {
      if (map.hasLayer(standardLayer)) map.removeLayer(standardLayer);
      if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
      if (!map.hasLayer(satelliteLabelsLayer)) satelliteLabelsLayer.addTo(map);
      container.classList.add("is-satellite");
    } else {
      if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      if (map.hasLayer(satelliteLabelsLayer)) map.removeLayer(satelliteLabelsLayer);
      if (!map.hasLayer(standardLayer)) standardLayer.addTo(map);
      container.classList.remove("is-satellite");
    }
  };

  const ensureInitialized = () => {
    if (map || !canvasEl) return;

    map = L.map(canvasEl, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    standardLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      },
    );

    satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 },
    );

    satelliteLabelsLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 },
    );

    let satelliteErrors = 0;
    satelliteLayer.on("tileerror", () => {
      satelliteErrors += 1;
      if (satelliteErrors >= 4 && currentMode === "satellite") {
        currentMode = "map";
        applyTileMode();
      }
    });

    markersLayer = L.layerGroup().addTo(map);
    applyTileMode();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (!isVisible || !map) return;
        map.invalidateSize({ pan: false });
        renderClusters();
      });
      resizeObserver.observe(canvasEl);
    }

    map.on("zoomend moveend", () => {
      renderClusters();
    });

    map.on("click", () => {
      hideCard();
    });

    renderClusters();
  };

  zoomInBtn?.addEventListener("click", () => map?.zoomIn(), { signal });
  zoomOutBtn?.addEventListener("click", () => map?.zoomOut(), { signal });
  compassBtn?.addEventListener(
    "click",
    () => {
      hideCard();
      map?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.65 });
    },
    { signal },
  );
  cardCloseBtn?.addEventListener("click", hideCard, { signal });

  return {
    setVisible(visible: boolean) {
      isVisible = visible;
      if (visible) {
        ensureInitialized();
        requestAnimationFrame(() => {
          map?.invalidateSize();
          renderClusters();
        });
      } else {
        hideCard();
      }
    },
    setMode(mode: MapMode) {
      currentMode = mode;
      if (mode !== "grid") {
        applyTileMode();
        if (isVisible) {
          requestAnimationFrame(() => {
            map?.invalidateSize();
            renderClusters();
          });
        }
      }
    },
    setFilteredSlugs(slugs: Set<string> | null) {
      filteredSlugs = slugs;
      if (activePopupSlug && slugs && !slugs.has(activePopupSlug)) {
        hideCard();
      }
      if (isVisible && map) {
        renderClusters();
        const active = getActiveDestinations();
        if (slugs && active.length > 0 && active.length <= 4) {
          const bounds = L.latLngBounds(active.map((d) => [d.lat, d.lng] as [number, number]));
          map.flyToBounds(bounds, { padding: [90, 90], maxZoom: 8, duration: 0.5 });
        }
      }
    },
    destroy() {
      resizeObserver?.disconnect();
      resizeObserver = null;
      map?.remove();
      map = null;
    },
  };
}
