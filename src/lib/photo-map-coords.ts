export interface MapCoords {
  lat: number;
  lng: number;
}

export function parsePhotoCoords(
  rawLat?: string | number,
  rawLng?: string | number,
): MapCoords | null {
  const lat = typeof rawLat === "number" ? rawLat : Number(rawLat);
  const lng = typeof rawLng === "number" ? rawLng : Number(rawLng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  return null;
}

const DESTINATION_COORDS: Record<string, MapCoords> = {
  "ha-giang": { lat: 22.8233, lng: 104.9836 },
  "sa-pa": { lat: 22.3364, lng: 103.8438 },
  "ta-chi-nhu": { lat: 21.6562, lng: 104.2878 },
  "ha-noi": { lat: 21.0285, lng: 105.8542 },
  "ha-long-bay": { lat: 20.9101, lng: 107.1839 },
  "trang-an": { lat: 20.2506, lng: 105.9375 },
  "tam-coc-hoa-lu": { lat: 20.2144, lng: 105.9228 },
  "thung-ui": { lat: 20.238, lng: 105.882 },
  hue: { lat: 16.4637, lng: 107.5909 },
  "da-nang": { lat: 16.0544, lng: 108.2022 },
  "hoi-an": { lat: 15.8801, lng: 108.338 },
  "quy-nhon": { lat: 13.7829, lng: 109.2197 },
  "phu-yen": { lat: 13.0882, lng: 109.0929 },
  "nha-trang": { lat: 12.2388, lng: 109.1967 },
  "da-lat": { lat: 11.9404, lng: 108.4583 },
  "bu-gia-map": { lat: 12.1964, lng: 107.2044 },
  "phu-quy": { lat: 10.5262, lng: 108.9432 },
  "sai-gon": { lat: 10.7769, lng: 106.7009 },
  "my-tho": { lat: 10.36, lng: 106.36 },
  "kien-giang": { lat: 10.0125, lng: 105.0809 },
  "thai-lan": { lat: 13.7563, lng: 100.5018 },
  "kuala-lumpur": { lat: 3.139, lng: 101.6869 },
  malacca: { lat: 2.1896, lng: 102.2501 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  bali: { lat: -8.4095, lng: 115.1889 },
};

export function resolvePhotoCoords(
  slug: string,
  rawLat?: string | number,
  rawLng?: string | number,
): MapCoords | null {
  const explicit = parsePhotoCoords(rawLat, rawLng);
  if (explicit) return explicit;
  return DESTINATION_COORDS[slug] ?? null;
}
