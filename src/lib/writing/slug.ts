import SlugifyLib from "slugify";

export function generateSlug(title: string): string {
  return SlugifyLib(title, {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
