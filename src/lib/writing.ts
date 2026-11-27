import { getCollection, type CollectionEntry } from "astro:content";
import { formatDate } from "./i18n";

export type WritingEntry = CollectionEntry<"writing">;

export async function getWritingEntries(): Promise<WritingEntry[]> {
  const entries = await getCollection("writing", ({ data }) => !data.draft);
  return entries.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() ||
      a.data.order - b.data.order ||
      a.slug.localeCompare(b.slug),
  );
}

export function writingReadTime(entry: WritingEntry) {
  return Math.max(1, Math.ceil(entry.body.trim().split(/\s+/).length / 200));
}

export function writingDate(date: Date) {
  return formatDate(date, "short");
}

export function writingCategorySlug(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function writingCategoryPath(category: string) {
  return `/writing/category/${writingCategorySlug(category)}`;
}

export function writingArchiveCategories(entries: WritingEntry[]) {
  return [
    ...new Set(
      entries
        .filter((entry) => entry.data.linkable !== false)
        .map((entry) => entry.data.category),
    ),
  ];
}
