import { describe, expect, it } from "vitest";
import {
  DEFAULT_CENTER,
  DARK_STYLE_URL,
  STANDARD_STYLE_URL,
  clusterDestinations,
  computeBoundsTuple,
  escapeHtml,
  serializeSlugs,
  type MapDestination,
} from "./photos-map";

function makeDest(overrides: Partial<MapDestination> & Pick<MapDestination, "slug" | "name" | "lat" | "lng" | "photoCount">): MapDestination {
  return {
    region: "North",
    country: "Vietnam",
    headline: "",
    heroPhoto: `/assets/photos/${overrides.slug}/hero.webp`,
    search: `${overrides.name} ${overrides.slug}`,
    ...overrides,
  };
}

describe("photos-map helpers", () => {
  it("uses [lng, lat] order for MapLibre default center", () => {
    const [lng, lat] = DEFAULT_CENTER;
    expect(lng).toBeGreaterThan(100);
    expect(lng).toBeLessThan(115);
    expect(lat).toBeGreaterThan(5);
    expect(lat).toBeLessThan(25);
  });

  it("configures OpenFreeMap Positron with a dark companion style", () => {
    expect(STANDARD_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/positron");
    expect(DARK_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/dark");
  });

  it("clusters nearby destinations in projected pixel space using highest photoCount as cover", () => {
    const items = [
      makeDest({ slug: "trang-an", name: "Tràng An", lat: 20.25, lng: 105.94, photoCount: 12 }),
      makeDest({ slug: "ha-noi", name: "Hà Nội", lat: 21.03, lng: 105.85, photoCount: 45 }),
      makeDest({ slug: "bali", name: "Bali", lat: -8.41, lng: 115.19, photoCount: 14 }),
    ];

    // Linear test projection: 10px per degree
    const project = ([lng, lat]: [number, number]) => ({ x: lng * 10, y: -lat * 10 });
    const clusters = clusterDestinations(items, project, 20);

    expect(clusters).toHaveLength(2);
    expect(clusters[0].cover.slug).toBe("ha-noi");
    expect(clusters[0].items.map((i) => i.slug)).toEqual(["ha-noi", "trang-an"]);
    expect(clusters[0].totalPhotos).toBe(57);
    expect(clusters[1].cover.slug).toBe("bali");
    expect(clusters[1].totalPhotos).toBe(14);
  });

  it("computes [sw, ne] LngLatBounds tuple in [lng, lat] order", () => {
    expect(computeBoundsTuple([])).toBeNull();
    expect(
      computeBoundsTuple([
        { lat: 21.03, lng: 105.85 },
        { lat: -8.41, lng: 115.19 },
        { lat: 10.78, lng: 106.7 },
      ]),
    ).toEqual([
      [105.85, -8.41],
      [115.19, 21.03],
    ]);
  });

  it("serializes slug filter sets deterministically and escapes HTML safely", () => {
    expect(serializeSlugs(null)).toBe("*");
    expect(serializeSlugs(new Set(["sa-pa", "bali", "hue"]))).toBe("bali,hue,sa-pa");
    expect(escapeHtml(`<img src="x" & 'y'>`)).toBe("&lt;img src=&quot;x&quot; &amp; 'y'&gt;");
  });
});
