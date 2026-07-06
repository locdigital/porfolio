import { locations } from "@/lib/locations";
import { MASONRY_GRID_SIZES, optimizePhotos } from "@/lib/photo-assets";
import { absoluteUrl, pageSchema } from "@/lib/seo";
import GalleryView from "./GalleryView";
import { Metadata } from "next";
import React from "react";

const galleryTitle = "Gallery | Phuc Loc Nguyen";
const galleryDescription = "Masonry archive of travel, street, and nature photography by Phuc Loc Nguyen.";

export const metadata: Metadata = {
  title: "Gallery",
  description: galleryDescription,
};

export default async function Page() {
  // Flatten all photos from all locations
  const allPhotos = locations.flatMap(loc =>
    loc.photos.map((photo, i) => ({
      ...photo,
      alt: `${loc.name} --- photo ${i + 1}`
    }))
  );

  // Deduplicate photos by src
  const uniqueRawPhotos = Array.from(
    new Map(allPhotos.map(p => [p.src, p])).values()
  );

  const uniquePhotos = await optimizePhotos(uniqueRawPhotos, {
    previewWidth: 520,
    previewWidths: [240, 360, 520, 760],   // tighter --- masonry columns max ~520px each
    previewSizes: MASONRY_GRID_SIZES,
    fullQuality: 75,
    withWebpFallback: true,
  });

  return (
    <GalleryView photos={uniquePhotos} />
  );
}
