import { responsiveImageAttributes } from "@/lib/photo-assets";
import photoUpdates from "../../../data/photo-updates.json";
import { resolvePhotoRegion } from "@/constants/regions";
import { getPhotoLocations } from "@/lib/content";

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

export interface PhotosApiPayload {
  destinationCount: number;
  totalPhotos: number;
  destinations: PhotosApiDestination[];
}

export async function buildPhotosApiPayload(): Promise<PhotosApiPayload> {
  const updates = photoUpdates as Record<string, { updatedAt: string }>;
  const updatedTime = (slug: string) => Date.parse(updates[slug]?.updatedAt ?? "") || 0;
  const locations = (await getPhotoLocations()).sort(
    (a, b) => updatedTime(b.slug) - updatedTime(a.slug) || a.order - b.order,
  );

  const destinations: PhotosApiDestination[] = locations.map((loc) => {
    const name = loc.name || loc.location;
    const region = resolvePhotoRegion(loc.country, loc.region);

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

  return {
    destinationCount: destinations.length,
    totalPhotos,
    destinations,
  };
}

export async function buildPhotosWidgetPayload() {
  const { destinations, totalPhotos } = await buildPhotosApiPayload();
  const thumbnails = new Map<string, Promise<string>>();
  const thumbnail = (src: string, photo?: PhotosApiPhoto) => {
    if (!src) return Promise.resolve("");
    let result = thumbnails.get(src);
    if (!result) {
      const width = Math.min(320, photo?.width || 320);
      const height = Math.round(width * (photo?.height || 240) / (photo?.width || 320));
      result = responsiveImageAttributes(src, { width, height, widths: [width] }).then((image) => image.src);
      thumbnails.set(src, result);
    }
    return result;
  };

  const widgetAlbums = await Promise.all(destinations.map(async (album) => {
    const cover = (src: string) => thumbnail(src, album.photos.find((photo) => photo.src === src));
    return {
      slug: album.slug, name: album.name, region: album.region, photoCount: album.photoCount,
      heroSrc: await cover(album.heroSrc),
      previewImages: await Promise.all(album.previewImages.map(cover)),
      photos: await Promise.all(album.photos.slice(0, 13).map(async (photo) => ({
        id: photo.id, alt: photo.alt || photo.destinationName, src: await thumbnail(photo.src, photo),
      }))),
    };
  }));
  return { totalPhotos, destinations: widgetAlbums };
}

export type PhotosWidgetPayload = Awaited<ReturnType<typeof buildPhotosWidgetPayload>>;
