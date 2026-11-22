export type SearchItemGroup =
  | "Navigation"
  | "Work"
  | "Writing"
  | "Growth"
  | "Photography";

export interface CommandSearchItem {
  title: string;
  description: string;
  href: string;
  group: SearchItemGroup;
  keywords?: string;
}

/**
 * Normalizes English and Vietnamese text for accent-insensitive search matching.
 * Converts đ/Đ to d, strips combining diacritics, and collapses whitespace.
 */
export function normalizeSearchText(value: string): string {
  return value
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Custom cmdk filter that supports Vietnamese diacritics and multi-word queries.
 * Returns a relevance score in [0, 1], where 0 hides the item.
 */
export function filterCommandItem(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const query = normalizeSearchText(search);
  if (!query) return 1;

  const rawPrimary = value.split(" :: ")[0] ?? value;
  const primary = normalizeSearchText(rawPrimary);
  const combined = normalizeSearchText(
    keywords && keywords.length > 0
      ? `${rawPrimary} ${keywords.join(" ")}`
      : rawPrimary,
  );

  const terms = query.split(" ").filter(Boolean);
  if (!terms.every((term) => combined.includes(term))) {
    return 0;
  }

  if (primary === query) return 1;
  if (primary.startsWith(query)) return 0.92;
  if (primary.includes(query)) return 0.8;

  const titleTermHits = terms.filter((term) => primary.includes(term)).length;
  if (titleTermHits === terms.length) return 0.72;
  if (titleTermHits > 0) return 0.56 + (titleTermHits / terms.length) * 0.1;

  if (combined.includes(query)) return 0.45;
  return 0.32;
}
