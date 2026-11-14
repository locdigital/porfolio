import { getCollection, type CollectionEntry } from "astro:content";

export async function getWritingEntries() {
  const entries = await getCollection("writing", ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.data.order - b.data.order || a.slug.localeCompare(b.slug));
}

export function writingReadTime(entry: CollectionEntry<"writing">) {
  return Math.max(1, Math.ceil(entry.body.trim().split(/\s+/).length / 200));
}

export function writingDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function writingCategorySlug(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function writingCategoryPath(category: string) {
  return `/writing/category/${writingCategorySlug(category)}`;
}
