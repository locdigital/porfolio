import type { APIRoute } from "astro";
import { getPhotoLocations } from "../../lib/content";
import photoUpdates from "../../../data/photo-updates.json";

export const prerender = true;

const regionLabels: Record<string, string> = {
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

export interface PhotosApiPhoto {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  title?: string;
  caption?: string;
  story?: string;
  capturedAt?: string;
  location: string;
  destinationSlug: string;
  destinationName: string;
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number | string;
}

export interface PhotosApiDestination {
  slug: string;
  name: string;
  region: string;
  country: string;
  headline: string;
  photoCount: number;
  heroSrc: string;
  previewImages: string[];
  photos: PhotosApiPhoto[];
}

export const GET: APIRoute = async () => {
  const updates = photoUpdates as Record<string, { updatedAt: string }>;
  const updatedTime = (slug: string) => Date.parse(updates[slug]?.updatedAt ?? "") || 0;
  const locations = (await getPhotoLocations()).sort(
    (a, b) => updatedTime(b.slug) - updatedTime(a.slug) || a.order - b.order,
  );

  const destinations: PhotosApiDestination[] = locations.map((loc) => {
    const name = loc.name || loc.location;
    const region =
      loc.country && loc.country !== "Vietnam"
        ? "International"
        : regionLabels[loc.region || ""] || "Vietnam";

    const photos: PhotosApiPhoto[] = (loc.photos || []).map((p, index) => ({
      id: p.id || `${loc.slug}-${index + 1}`,
      src: p.src,
      alt: p.alt,
      width: p.w,
      height: p.h,
      title: p.title,
      caption: p.caption,
      story: p.story,
      capturedAt: p.capturedAt,
      location: p.location || name,
      destinationSlug: loc.slug,
      destinationName: name,
      camera: p.camera,
      lens: p.lens,
      focalLength: p.focalLength,
      aperture: p.aperture,
      shutterSpeed: p.shutterSpeed,
      iso: p.iso,
    }));

    const heroSrc = loc.heroImage?.src || photos[0]?.src || "";
    const previewImages = [
      heroSrc,
      photos[1]?.src || heroSrc,
      photos[2]?.src || photos[0]?.src || heroSrc,
    ].filter(Boolean);

    return {
      slug: loc.slug,
      name,
      region,
      country: loc.country || "Vietnam",
      headline: loc.headline || "",
      photoCount: photos.length,
      heroSrc,
      previewImages,
      photos,
    };
  });

  const totalPhotos = destinations.reduce((sum, d) => sum + d.photoCount, 0);

  return new Response(
    JSON.stringify({
      destinationCount: destinations.length,
      totalPhotos,
      destinations,
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
