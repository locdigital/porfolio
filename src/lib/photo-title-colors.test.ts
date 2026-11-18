import { describe, expect, it } from "vitest";
import { getSeededTitleColor, PHOTO_TITLE_COLORS, pickShuffledTitleColors } from "./photo-title-colors";

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("photo title color palette", () => {
  it("keeps every palette color legible (>= 4.5:1) against white surface", () => {
    for (const hex of PHOTO_TITLE_COLORS) {
      const contrast = 1.05 / (relativeLuminance(hex) + 0.05);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("picks deterministic SSR colors and never assigns equal adjacent randomized colors", () => {
    expect(PHOTO_TITLE_COLORS).toContain(getSeededTitleColor("photo-bu-gia-map-1"));
    const colors = pickShuffledTitleColors(40);
    expect(colors).toHaveLength(40);
    for (let i = 1; i < colors.length; i++) {
      expect(colors[i]).not.toBe(colors[i - 1]);
    }
  });
});
