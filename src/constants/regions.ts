export const PHOTO_REGION_LABELS: Record<string, string> = {
  "Northern Vietnam": "North",
  "Central Highlands": "Highlands",
  "Central Vietnam": "Central",
  "South Central Coast": "Central",
  "Southern Vietnam": "South",
  "Mekong Delta": "South",
  "Miền Bắc": "North",
  "Tây Nguyên": "Highlands",
  "Miền Trung": "Central",
  "Nam Trung Bộ": "Central",
  "Miền Nam": "South",
  "Tây Nam Bộ": "South",
};

export const PHOTO_REGION_ORDER = [
  "North",
  "Highlands",
  "Central",
  "South",
  "International",
] as const;

export const PHOTO_REGION_ALIASES: Record<string, string> = {
  "mien bac": "north",
  bac: "north",
  "tay nguyen": "highlands",
  "mien trung": "central",
  trung: "central",
  "mien nam": "south",
  nam: "south",
  "quoc te": "international",
  "nuoc ngoai": "international",
  hcm: "sai gon",
  tphcm: "sai gon",
  "ho chi minh": "sai gon",
};

export function resolvePhotoRegion(country?: string, rawRegion?: string): string {
  if (country && country !== "Vietnam") {
    return "International";
  }
  return PHOTO_REGION_LABELS[rawRegion || ""] || "Vietnam";
}
