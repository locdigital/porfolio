const GENERIC_ALT_PATTERN =
  /^(?:.*(?:—|---|-)\s*(?:DSC_[^\s]+|IMG_[^\s]+|photo\s+\d+)|DSC_[^\s]+|IMG_[^\s]+)$/i;

/**
 * Resolves a descriptive alt text for a gallery photograph using only verified
 * image metadata (existing alt, caption, title, and location), replacing
 * raw camera filename placeholders without fabricating scene claims.
 */
export function resolvePhotoAlt(
  image: { alt?: string; caption?: string; title?: string; location?: string },
  albumName: string,
  index: number,
): string {
  const existing = image.alt?.trim() ?? "";
  if (existing && !GENERIC_ALT_PATTERN.test(existing)) {
    return existing;
  }
  const caption = image.caption?.trim();
  if (caption && !GENERIC_ALT_PATTERN.test(caption)) {
    return caption;
  }
  const title = image.title?.trim();
  const place = image.location?.trim() || albumName;
  if (title) {
    return place && !title.toLowerCase().includes(place.toLowerCase())
      ? `${title} — ${place}`
      : title;
  }
  return existing || `${place} — photograph ${index + 1}`;
}
