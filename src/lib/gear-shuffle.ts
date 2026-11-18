export const GEAR_MEDIA_RATIOS = ["4 / 3", "1 / 1", "4 / 5", "5 / 4"] as const;

const SESSION_STORAGE_KEY = "gearFirstSlug";

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/**
 * Returns a Fisher-Yates shuffled shallow copy while avoiding repeating the
 * previous leading item when more than one item exists.
 */
export function buildShuffledGearOrder<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  prevFirstKey?: string | null,
): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (prevFirstKey && result.length > 1 && getKey(result[0]) === prevFirstKey) {
    const swapIdx = 1 + randomInt(result.length - 1);
    [result[0], result[swapIdx]] = [result[swapIdx], result[0]];
  }
  return result;
}

/**
 * Prepares the gear masonry grid once per page mount/swap. Grids marked with
 * `data-gear-ordered` preserve their editorial category order; other grids
 * retain the original shuffled presentation.
 */
export function shuffleGearGrid(root: ParentNode = document): void {
  const grid = root.querySelector<HTMLElement>("[data-gear-masonry]");
  if (!grid || grid.dataset.gearShuffled === "1") return;

  try {
    const cards = Array.from(grid.children).filter((el): el is HTMLElement => el instanceof HTMLElement);
    if (cards.length < 2) return;

    let orderedCards = cards;
    if (grid.dataset.gearOrdered !== "1") {
      let prevFirst: string | null = null;
      try {
        prevFirst = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      } catch {
        prevFirst = null;
      }

      orderedCards = buildShuffledGearOrder(cards, (card) => card.dataset.slug ?? "", prevFirst);

      try {
        const nextFirst = orderedCards[0]?.dataset.slug;
        if (nextFirst) window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextFirst);
      } catch {
        // Ignore storage access restrictions in private browsing.
      }
    }

    const fragment = document.createDocumentFragment();
    orderedCards.forEach((card, index) => {
      card.style.setProperty("--gear-media-ratio", GEAR_MEDIA_RATIOS[index % GEAR_MEDIA_RATIOS.length]);
      const img = card.querySelector<HTMLImageElement>("img");
      if (img) {
        // Multi-column masonry lays out top rows across columns concurrently.
        const inTopRows = index < 4 || index % 9 < 3;
        img.loading = inTopRows ? "eager" : "lazy";
        img.setAttribute("fetchpriority", index === 0 ? "high" : "auto");
      }
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  } finally {
    grid.dataset.gearShuffled = "1";
  }
}
