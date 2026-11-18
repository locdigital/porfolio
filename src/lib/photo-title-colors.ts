/** Curated vivid title colors with >= 4.5:1 contrast against the white notes surface (#FFFFFF). */
export const PHOTO_TITLE_COLORS = [
  "#D9381E",
  "#C92A2A",
  "#C2255C",
  "#A61E4D",
  "#9C36B5",
  "#7048E8",
  "#5F3DC4",
  "#3B5BDB",
  "#1D4ED8",
  "#1971C2",
  "#0B7285",
  "#087F5B",
  "#237E36",
  "#497D0C",
  "#B45309",
  "#C2410C",
] as const;

export function getSeededTitleColor(id: string): string {
  const seed = [...id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return PHOTO_TITLE_COLORS[seed % PHOTO_TITLE_COLORS.length];
}

/**
 * Generates `count` randomized palette colors via reshuffled decks so each page load
 * stays vibrant and adjacent cards never receive the same color.
 */
export function pickShuffledTitleColors(count: number, random: () => number = Math.random): string[] {
  const result: string[] = [];
  let deck: string[] = [];

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      deck = [...PHOTO_TITLE_COLORS];
      for (let j = deck.length - 1; j > 0; j--) {
        const k = Math.floor(random() * (j + 1));
        [deck[j], deck[k]] = [deck[k], deck[j]];
      }
      if (result.length > 0 && deck[0] === result[result.length - 1] && deck.length > 1) {
        [deck[0], deck[1]] = [deck[1], deck[0]];
      }
    }
    result.push(deck.shift()!);
  }

  return result;
}
